/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { mdimg, createImageOutputProcessor } = require("../lib/mdimg.js");
const { expectMarkdown, useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const expectImage = useImageAssertions();
const options = () => ({
  inputFilename: workspace.inputFilename,
  extensions: false,
});

async function expectFile(result, outputFilename, format, dimensions) {
  expect(result.path).toBe(outputFilename);
  const onDisk = readFileSync(outputFilename);
  expect(onDisk).toEqual(Buffer.from(result.data));
  expectMarkdown(result.html);
  await expectImage(onDisk, format, dimensions);
}

test("NODE: base conversion renders Markdown to a readable PNG", async () => {
  const outputFilename = resolve(workspace.dir, "base.png");
  const result = await mdimg({ ...options(), outputFilename });
  await expectFile(result, outputFilename, "png");
});

test("NODE: github CSS preset respects the requested width", async () => {
  const outputFilename = resolve(workspace.dir, "github.png");
  const result = await mdimg({
    ...options(),
    outputFilename,
    width: 1000,
    cssTemplate: "github",
  });
  expect(result.html).toContain(".markdown-body");
  await expectFile(result, outputFilename, "png", { width: 1000 });
});

test("NODE: disabling extensions omits their scripts from rendered HTML", async () => {
  const outputFilename = resolve(workspace.dir, "no-extensions.png");
  const result = await mdimg({ ...options(), outputFilename });
  expect(result.html).not.toContain("hljs.highlightAll()");
  expect(result.html).not.toContain("mermaid.initialize(");
  expect(result.html).not.toContain("MathJax =");
  await expectFile(result, outputFilename, "png");
});

test("NODE: highlight.js renders code in the browser", async () => {
  let highlightedText;
  const processor = createImageOutputProcessor("png", undefined, "binary");
  const outputFilename = resolve(workspace.dir, "highlighted.png");
  const result = await mdimg({
    ...options(),
    outputFilename,
    extensions: { highlightJs: true, mathJax: false, mermaid: false },
    outputProcessor: {
      ...processor,
      async process(context) {
        highlightedText = await context.page.$eval(
          "code.hljs .hljs-string",
          (element) => element.textContent,
        );
        return processor.process(context);
      },
    },
  });
  expect(highlightedText).toBe("'hi'");
  await expectFile(result, outputFilename, "png");
});

test("NODE: custom HTML and CSS affect the generated image", async () => {
  const outputFilename = resolve(workspace.dir, "template.png");
  const result = await mdimg({
    ...options(),
    outputFilename,
    width: 320,
    htmlText:
      '<div id="mdimg-body"><article class="markdown-body"></article></div>',
    cssText:
      "body { margin: 0; } #mdimg-body { height: 200px; background: rgb(10, 20, 30); color: white; } h1 { margin: 0; }",
  });
  expect(result.html).toContain('<article class="markdown-body">');
  await expectFile(result, outputFilename, "png", {
    width: 320,
    height: 200,
    pixel: [10, 20, 30, 255],
  });
});

test("NODE: output extension selects JPEG even when type is PNG", async () => {
  const outputFilename = resolve(workspace.dir, "low-quality.jpeg");
  const result = await mdimg({
    ...options(),
    outputFilename,
    type: "png",
    quality: 60,
  });
  await expectFile(result, outputFilename, "jpeg");
});

test.each(["base64", "blob"])(
  "NODE: WEBP %s data decodes to the requested image without writing files",
  async (encoding) => {
    const result = await mdimg({ ...options(), type: "webp", encoding });
    if (encoding === "base64") {
      expect(typeof result.data).toBe("string");
      expect(result.data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    } else expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBeUndefined();
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
    expectMarkdown(result.html);
    const data =
      encoding === "base64" ? Buffer.from(result.data, "base64") : result.data;
    await expectImage(data, "webp");
  },
);

test("NODE: concurrent conversions keep input, output and temporary HTML isolated", async () => {
  const cases = [
    {
      name: "red",
      width: 240,
      color: "rgb(255, 0, 0)",
      pixel: [255, 0, 0, 255],
    },
    {
      name: "blue",
      width: 360,
      color: "rgb(0, 0, 255)",
      pixel: [0, 0, 255, 255],
    },
  ];
  const results = await Promise.all(
    cases.map(({ name, width, color }) => {
      const inputFilename = resolve(workspace.dir, `${name}.md`);
      writeFileSync(inputFilename, `# ${name}`);
      return mdimg({
        inputFilename,
        outputFilename: resolve(workspace.dir, `${name}.png`),
        extensions: false,
        width,
        cssText: `body { margin: 0; } #mdimg-body { height: 100px; background: ${color}; } h1 { margin: 0; }`,
      });
    }),
  );
  for (const [index, { name, width, pixel }] of cases.entries()) {
    const result = results[index];
    expect(result.html).toContain(`<h1>${name}</h1>`);
    expect(result.path).toBe(resolve(workspace.dir, `${name}.png`));
    expect(readFileSync(result.path)).toEqual(Buffer.from(result.data));
    await expectImage(result.data, "png", { width, height: 100, pixel });
  }
  expect(readdirSync(workspace.dir).sort()).toEqual([
    "blue.md",
    "blue.png",
    "input.md",
    "red.md",
    "red.png",
  ]);
});

test("NODE: invalid HTML rejects without leaving temporary HTML or output files", async () => {
  await expect(
    mdimg({
      ...options(),
      outputFilename: resolve(workspace.dir, "invalid.png"),
      htmlText: '<div class="markdown-body"></div>',
    }),
  ).rejects.toThrow(/missing HTML element with id: mdimg-body/);
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test.each([
  [{}, /text or file is required/],
  [{ inputText: "Hello", encoding: "invalid" }, /encoding type invalid/],
  [{ inputText: "Hello", type: "gif" }, /output file type gif/],
])(
  "NODE: invalid options reject with a conversion error (%j)",
  async (input, error) => {
    await expect(mdimg(input)).rejects.toThrow(error);
  },
);
