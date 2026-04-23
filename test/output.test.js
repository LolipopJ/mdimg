/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg } = require("../lib/mdimg.js");
const {
  createHtmlOutputProcessor,
  createPdfOutputProcessor,
  createImageOutputProcessor,
} = require("../lib/mdimg.js");
const { resolve } = require("path");
const { existsSync, readFileSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "./static/test.md");
const outputDir = resolve(__dirname, "../mdimg_output");
const defaultOptions = {
  inputFilename: inputFilenameTest,
  extensions: false,
};

// ─── createHtmlOutputProcessor ───────────────────────────────────────────────

test("OUTPUT: createHtmlOutputProcessor returns HTML string in-memory without outputFilename", async () => {
  const res = await mdimg({
    ...defaultOptions,
    outputProcessor: createHtmlOutputProcessor(),
  });

  // data must be a non-empty HTML string containing the mdimg body element
  expect(typeof res.data).toBe("string");
  expect(res.data).toContain('id="mdimg-body"');

  // no disk write when outputFilename is omitted
  expect(res.path).toBeUndefined();
});

test("OUTPUT: createHtmlOutputProcessor writes file when outputFilename is given", async () => {
  const outputFilename = resolve(outputDir, "test-output-processor.html");

  const res = await mdimg({
    ...defaultOptions,
    outputFilename,
    outputProcessor: createHtmlOutputProcessor(),
  });

  expect(res.path).toBe(outputFilename);
  expect(existsSync(outputFilename)).toBe(true);

  const written = readFileSync(outputFilename, "utf8");
  expect(written).toContain('id="mdimg-body"');
});

test("OUTPUT: createHtmlOutputProcessor does not launch browser (requiresPage: false)", () => {
  expect(createHtmlOutputProcessor().requiresPage).toBe(false);
});

// ─── createPdfOutputProcessor ────────────────────────────────────────────────

test("OUTPUT: createPdfOutputProcessor returns Uint8Array in-memory without outputFilename", async () => {
  const res = await mdimg({
    ...defaultOptions,
    outputProcessor: createPdfOutputProcessor(),
  });

  expect(res.data).toBeInstanceOf(Uint8Array);
  expect(res.data.length).toBeGreaterThan(0);
  expect(res.path).toBeUndefined();
});

test("OUTPUT: createPdfOutputProcessor writes file when outputFilename is given", async () => {
  const outputFilename = resolve(outputDir, "test-output-processor.pdf");

  const res = await mdimg({
    ...defaultOptions,
    outputFilename,
    outputProcessor: createPdfOutputProcessor({ printBackground: true }),
  });

  expect(res.path).toBe(outputFilename);
  expect(existsSync(outputFilename)).toBe(true);

  // PDF magic bytes: %PDF
  const header = readFileSync(outputFilename, { encoding: "utf8" }).slice(0, 4);
  expect(header).toBe("%PDF");
});

test("OUTPUT: createPdfOutputProcessor requires a browser page (requiresPage !== false)", () => {
  expect(createPdfOutputProcessor().requiresPage).not.toBe(false);
});

// ─── createImageOutputProcessor ──────────────────────────────────────────────

test("OUTPUT: createImageOutputProcessor returns Uint8Array for binary encoding (default)", async () => {
  const res = await mdimg({
    ...defaultOptions,
    outputProcessor: createImageOutputProcessor("png", undefined, "binary"),
  });

  expect(res.data).toBeInstanceOf(Uint8Array);
  expect(res.data.length).toBeGreaterThan(0);
  expect(res.path).toBeUndefined();
});

test("OUTPUT: createImageOutputProcessor returns base64 string for base64 encoding", async () => {
  const res = await mdimg({
    ...defaultOptions,
    outputProcessor: createImageOutputProcessor("png", undefined, "base64"),
  });

  expect(typeof res.data).toBe("string");
  // base64 string should be non-empty and decodable
  expect(res.data.length).toBeGreaterThan(0);
  expect(() => Buffer.from(res.data, "base64")).not.toThrow();
});

test("OUTPUT: createImageOutputProcessor writes PNG to disk when outputFilename is given", async () => {
  const outputFilename = resolve(outputDir, "test-image-processor.png");

  const res = await mdimg({
    ...defaultOptions,
    outputFilename,
    outputProcessor: createImageOutputProcessor("png", undefined, "binary"),
  });

  expect(res.path).toBe(outputFilename);
  expect(existsSync(outputFilename)).toBe(true);

  // PNG magic bytes: \x89PNG
  const header = readFileSync(outputFilename).slice(0, 4);
  expect(header[0]).toBe(0x89);
  expect(header.slice(1, 4).toString()).toBe("PNG");
});

test("OUTPUT: createImageOutputProcessor writes JPEG to disk when outputFilename is given", async () => {
  const outputFilename = resolve(outputDir, "test-image-processor.jpg");

  const res = await mdimg({
    ...defaultOptions,
    outputFilename,
    outputProcessor: createImageOutputProcessor("jpeg", 80, "binary"),
  });

  expect(res.path).toBe(outputFilename);
  expect(existsSync(outputFilename)).toBe(true);

  // JPEG magic bytes: FF D8
  const header = readFileSync(outputFilename).slice(0, 2);
  expect(header[0]).toBe(0xff);
  expect(header[1]).toBe(0xd8);
});

test("OUTPUT: createImageOutputProcessor requires a browser page (requiresPage !== false)", () => {
  expect(
    createImageOutputProcessor("png", undefined, "binary").requiresPage,
  ).not.toBe(false);
});

test("OUTPUT: createImageOutputProcessor format matches the type argument", () => {
  expect(createImageOutputProcessor("png", undefined, "binary").format).toBe(
    "png",
  );
  expect(createImageOutputProcessor("jpeg", 80, "binary").format).toBe("jpeg");
  expect(createImageOutputProcessor("webp", 90, "base64").format).toBe("webp");
});

// ─── Custom IOutputProcessor ─────────────────────────────────────────────────

test("OUTPUT: custom processor receives html, page, body and outputPath", async () => {
  const capturedCtx = {};

  const customProcessor = {
    format: "txt",
    requiresPage: true,
    async process(ctx) {
      Object.assign(capturedCtx, ctx);
      return { data: "custom" };
    },
  };

  const outputFilename = resolve(outputDir, "test-custom-processor.txt");

  await mdimg({
    ...defaultOptions,
    outputFilename,
    outputProcessor: customProcessor,
  });

  expect(typeof capturedCtx.html).toBe("string");
  expect(capturedCtx.html).toContain('id="mdimg-body"');
  expect(capturedCtx.page).toBeDefined();
  expect(capturedCtx.body).toBeDefined();
  expect(capturedCtx.outputPath).toBe(outputFilename);
});

test("OUTPUT: custom processor without outputFilename receives no outputPath", async () => {
  let receivedOutputPath;

  const customProcessor = {
    format: "txt",
    requiresPage: false,
    async process(ctx) {
      receivedOutputPath = ctx.outputPath;
      return { data: "hello" };
    },
  };

  const res = await mdimg({
    ...defaultOptions,
    outputProcessor: customProcessor,
  });

  expect(receivedOutputPath).toBeUndefined();
  expect(res.path).toBeUndefined();
  expect(res.data).toBe("hello");
});

// ─── ESM smoke test ───────────────────────────────────────────────────────────

test("ESM: mdimg.mjs exports core functions without throwing", () => {
  const { execFileSync } = require("child_process");
  const { resolve } = require("path");

  const script = [
    "import { mdimg, createHtmlOutputProcessor, createPdfOutputProcessor, createImageOutputProcessor } from './lib/mdimg.mjs';",
    "if (typeof mdimg !== 'function') throw new Error('mdimg not exported');",
    "if (typeof createHtmlOutputProcessor !== 'function') throw new Error('createHtmlOutputProcessor not exported');",
    "if (typeof createPdfOutputProcessor !== 'function') throw new Error('createPdfOutputProcessor not exported');",
    "if (typeof createImageOutputProcessor !== 'function') throw new Error('createImageOutputProcessor not exported');",
    "process.stdout.write('ok');",
  ].join("\n");

  const result = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      cwd: resolve(__dirname, ".."),
      encoding: "utf8",
    },
  );

  expect(result.trim()).toBe("ok");
});
