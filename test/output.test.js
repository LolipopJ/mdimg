/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync } = require("child_process");
const { readFileSync, readdirSync } = require("fs");
const { resolve } = require("path");
const {
  mdimg,
  createHtmlOutputProcessor,
  createPdfOutputProcessor,
  createImageOutputProcessor,
} = requirePackage(__filename)("../lib/mdimg.js");
const {
  expectMarkdown,
  expectPdf,
  useImageAssertions,
} = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const expectImage = useImageAssertions();
const options = () => ({
  inputFilename: workspace.inputFilename,
  extensions: false,
});

test("OUTPUT: HTML processor returns the converted document without disk output", async () => {
  const result = await mdimg({
    ...options(),
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(result.data).toBe(result.html);
  expectMarkdown(result.data);
  expect(result.path).toBeUndefined();
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("OUTPUT: HTML processor writes the converted document to disk", async () => {
  const outputFilename = resolve(workspace.dir, "nested", "result.html");
  const result = await mdimg({
    ...options(),
    outputFilename,
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(result.path).toBe(outputFilename);
  const onDisk = readFileSync(outputFilename, "utf8");
  expect(onDisk).toBe(result.data);
  expectMarkdown(onDisk);
});

test.each([false, true])(
  "OUTPUT: PDF processor generates readable text and page dimensions (disk=%s)",
  async (saveToDisk) => {
    const outputFilename = saveToDisk
      ? resolve(workspace.dir, "result.pdf")
      : undefined;
    const result = await mdimg({
      ...options(),
      cssText: "body { margin: 0; } h1 { margin: 0; }",
      outputFilename,
      outputProcessor: createPdfOutputProcessor({
        width: "4in",
        height: "3in",
        printBackground: true,
      }),
    });
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBe(outputFilename);
    expectMarkdown(result.html);
    const data = saveToDisk ? readFileSync(outputFilename) : result.data;
    expect(Buffer.from(data)).toEqual(Buffer.from(result.data));
    expectPdf(data);
    if (!saveToDisk) expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test.each([
  ["png", "binary"],
  ["png", "base64"],
  ["jpeg", "binary"],
  ["webp", "binary"],
])(
  "OUTPUT: image processor returns a readable %s in %s",
  async (format, encoding) => {
    const result = await mdimg({
      ...options(),
      outputProcessor: createImageOutputProcessor(
        format,
        format === "png" ? undefined : 80,
        encoding,
      ),
    });
    const data =
      encoding === "base64" ? Buffer.from(result.data, "base64") : result.data;
    if (encoding === "base64") {
      expect(typeof result.data).toBe("string");
      expect(result.data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    } else expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBeUndefined();
    expectMarkdown(result.html);
    await expectImage(data, format);
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test.each(["png", "jpeg", "webp"])(
  "OUTPUT: image processor writes the returned %s bytes to disk",
  async (format) => {
    const outputFilename = resolve(workspace.dir, `result.${format}`);
    const result = await mdimg({
      ...options(),
      outputFilename,
      outputProcessor: createImageOutputProcessor(
        format,
        format === "png" ? undefined : 80,
        "binary",
      ),
    });
    expect(result.path).toBe(outputFilename);
    const onDisk = readFileSync(outputFilename);
    expect(onDisk).toEqual(Buffer.from(result.data));
    expectMarkdown(result.html);
    await expectImage(onDisk, format);
  },
);

test("OUTPUT: custom processor can inspect the rendered page and body", async () => {
  const outputFilename = resolve(workspace.dir, "custom.txt");
  const result = await mdimg({
    ...options(),
    outputFilename,
    outputProcessor: {
      format: "txt",
      async process({ html, page, body, outputPath }) {
        expectMarkdown(html);
        expect(outputPath).toBe(outputFilename);
        expect(await page.$eval("h1", (element) => element.textContent)).toBe(
          "Hello",
        );
        return { data: await body.evaluate((element) => element.textContent) };
      },
    },
  });
  expect(result.data).toContain("Hello");
  expect(result.data).toContain("This is a test document.");
  expect(readFileSync(outputFilename, "utf8")).toBe(result.data);
});

test("OUTPUT: custom processor without a page receives HTML and no browser handles", async () => {
  const result = await mdimg({
    ...options(),
    outputProcessor: {
      format: "txt",
      requiresPage: false,
      async process({ html, page, body, outputPath }) {
        expectMarkdown(html);
        expect(page).toBeUndefined();
        expect(body).toBeUndefined();
        expect(outputPath).toBeUndefined();
        return { data: "hello" };
      },
    },
  });
  expect(result.path).toBeUndefined();
  expect(result.data).toBe("hello");
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("ESM: public exports convert Markdown to HTML", () => {
  const script = [
    "import { mdimg, createHtmlOutputProcessor, createPdfOutputProcessor, createImageOutputProcessor } from './lib/mdimg.mjs';",
    "if (typeof createPdfOutputProcessor !== 'function' || typeof createImageOutputProcessor !== 'function') throw new Error('missing exports');",
    "const result = await mdimg({ inputText: '# Hello\\n\\nThis is a **test** document.\\n\\n```js\\nconsole.log(\"hi\");\\n```', extensions: false, outputProcessor: createHtmlOutputProcessor() });",
    "process.stdout.write(JSON.stringify(result));",
  ].join("\n");
  const result = JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: resolve(__dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    }),
  );
  expect(result.data).toBe(result.html);
  expect(result.data).toContain("<h1>Hello</h1>");
  expect(result.data).toContain("<strong>test</strong>");
  expect(result.data).toContain('console.log("hi");');
  expect(result.path).toBeUndefined();
});
