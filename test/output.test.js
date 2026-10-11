const { existsSync, readFileSync, readdirSync } = require("fs");
const { resolve } = require("path");
const puppeteer = requirePackage(__filename)("puppeteer").default;
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

afterEach(() => jest.restoreAllMocks());

test.each([false, true])(
  "OUTPUT: HTML ignores image options without launching a browser (disk=%s)",
  async (saveToDisk) => {
    const launch = jest.spyOn(puppeteer, "launch").mockImplementation(() => {
      throw new Error("HTML output must not launch a browser");
    });
    const outputFilename = saveToDisk
      ? resolve(workspace.dir, "nested", "result.html")
      : undefined;
    const result = await mdimg({
      ...options(),
      type: "jpeg",
      encoding: "blob",
      quality: 0,
      outputFilename,
      outputProcessor: createHtmlOutputProcessor(),
    });
    expect(launch).not.toHaveBeenCalled();
    expect(result.data).toBe(result.html);
    expectMarkdown(result.data);
    expect(result.path).toBe(outputFilename);
    if (saveToDisk) {
      expect(readFileSync(outputFilename, "utf8")).toBe(result.data);
      expect(readdirSync(resolve(workspace.dir, "nested"))).toEqual([
        "result.html",
      ]);
    } else expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test.each([
  ["custom", false, { width: "4in", height: "3in" }, 288, 216],
  ["custom", true, { width: "4in", height: "3in" }, 288, 216],
  ["A4", true, { format: "A4" }, 595.28, 841.89],
])(
  "OUTPUT: PDF %s ignores image options and preserves text and dimensions (disk=%s)",
  async (_format, saveToDisk, pdfOptions, width, height) => {
    const outputFilename = saveToDisk
      ? resolve(workspace.dir, "result.pdf")
      : undefined;
    const result = await mdimg({
      ...options(),
      type: "webp",
      encoding: "base64",
      quality: 0,
      cssText: "body { margin: 0; } h1 { margin: 0; }",
      outputFilename,
      outputProcessor: createPdfOutputProcessor({
        ...pdfOptions,
        printBackground: true,
      }),
    });
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBe(outputFilename);
    expectMarkdown(result.html);
    const data = saveToDisk ? readFileSync(outputFilename) : result.data;
    expect(Buffer.from(data)).toEqual(Buffer.from(result.data));
    expectPdf(data, { width, height });
    if (!saveToDisk) expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test.each([
  ["png", "binary", true],
  ["jpeg", "binary", false],
  ["webp", "blob", true],
  ["png", "base64", false],
])(
  "OUTPUT: image processor returns readable %s/%s bytes (disk=%s)",
  async (format, encoding, saveToDisk) => {
    const outputFilename = saveToDisk
      ? resolve(workspace.dir, `result.${format}`)
      : undefined;
    const result = await mdimg({
      ...options(),
      type: format === "jpeg" ? "webp" : "jpeg",
      encoding: encoding === "base64" ? "blob" : "base64",
      quality: 0,
      outputFilename,
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
    expect(result.path).toBe(outputFilename);
    expectMarkdown(result.html);
    await expectImage(data, format);
    if (saveToDisk) {
      expect(readFileSync(outputFilename)).toEqual(Buffer.from(data));
      expect(readdirSync(workspace.dir).sort()).toEqual([
        "input.md",
        `result.${format}`,
      ]);
    } else expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test.each(["base64", "blob"])(
  "OUTPUT: default image %s stays in memory despite an explicit output path",
  async (encoding) => {
    const outputFilename = resolve(workspace.dir, "not-written.png");
    const result = await mdimg({
      ...options(),
      outputFilename,
      encoding,
    });
    expect(result.path).toBeUndefined();
    expect(existsSync(outputFilename)).toBe(false);
    expectMarkdown(result.html);
    if (encoding === "base64") {
      expect(typeof result.data).toBe("string");
      expect(result.data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    } else expect(result.data).toBeInstanceOf(Uint8Array);
    const data =
      encoding === "base64" ? Buffer.from(result.data, "base64") : result.data;
    await expectImage(data, "png");
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test("OUTPUT: JPEG quality zero produces smaller readable output than quality 100", async () => {
  const imageOptions = {
    ...options(),
    type: "jpeg",
    encoding: "blob",
    width: 320,
  };
  const low = await mdimg({ ...imageOptions, quality: 0 });
  const high = await mdimg({ ...imageOptions, quality: 100 });
  for (const result of [low, high]) {
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBeUndefined();
    expectMarkdown(result.html);
    await expectImage(result.data, "jpeg", { width: 320 });
  }
  expect(low.data.length).toBeLessThan(high.data.length);
  expect(readFileSync(workspace.inputFilename, "utf8")).toContain("# Hello");
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("OUTPUT: image processor quality is independent of global quality", async () => {
  const imageOptions = {
    ...options(),
    type: "webp",
    encoding: "base64",
    width: 320,
    outputProcessor: createImageOutputProcessor("jpeg", 80, "binary"),
  };
  const low = await mdimg({ ...imageOptions, quality: 0 });
  const high = await mdimg({ ...imageOptions, quality: 100 });
  for (const result of [low, high]) {
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBeUndefined();
    expectMarkdown(result.html);
  }
  expect(Buffer.from(low.data)).toEqual(Buffer.from(high.data));
  await expectImage(low.data, "jpeg", { width: 320 });
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("OUTPUT: custom processor can inspect the rendered page and body", async () => {
  const outputFilename = resolve(workspace.dir, "custom.txt");
  const result = await mdimg({
    ...options(),
    type: "jpeg",
    encoding: "blob",
    quality: 0,
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
  expect(result.path).toBe(outputFilename);
  expectMarkdown(result.html);
  expect(readFileSync(outputFilename, "utf8")).toBe(result.data);
});

test.each([false, true])(
  "OUTPUT: custom processor without a page ignores blob without launching (disk=%s)",
  async (saveToDisk) => {
    const launch = jest.spyOn(puppeteer, "launch").mockImplementation(() => {
      throw new Error("No-page processor must not launch a browser");
    });
    const outputFilename = saveToDisk
      ? resolve(workspace.dir, "custom.txt")
      : undefined;
    const result = await mdimg({
      ...options(),
      type: "webp",
      encoding: "blob",
      quality: 0,
      outputFilename,
      outputProcessor: {
        format: "txt",
        requiresPage: false,
        async process({ html, page, body, outputPath }) {
          expectMarkdown(html);
          expect(page).toBeUndefined();
          expect(body).toBeUndefined();
          expect(outputPath).toBe(outputFilename);
          return { data: "hello" };
        },
      },
    });
    expect(launch).not.toHaveBeenCalled();
    expect(result.path).toBe(outputFilename);
    expect(result.data).toBe("hello");
    expectMarkdown(result.html);
    if (saveToDisk) expect(readFileSync(outputFilename, "utf8")).toBe("hello");
    expect(readdirSync(workspace.dir).sort()).toEqual(
      saveToDisk ? ["custom.txt", "input.md"] : ["input.md"],
    );
  },
);
