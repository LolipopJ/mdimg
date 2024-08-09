/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg } = require("../lib/mdimg.js");
const { resolve } = require("path");
const { writeFileSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "test.md");
const outputDir = resolve(__dirname, "../mdimg_output");

test("NODE: base convert", async () => {
  const outputFilename = resolve(outputDir, "test-node-1.png");

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: with `github` CSS preset", async () => {
  const outputFilename = resolve(outputDir, "test-node-2.png");

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
    width: 600,
    cssTemplate: "github",
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: with template text", async () => {
  const outputFilename = resolve(outputDir, "test-node-3.png");
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div>';
  const cssText =
    '@import "https://cdn.jsdelivr.net/npm/normalize.css/normalize.min.css"; .markdown-body { padding: 6rem 4rem; }';

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
    htmlText,
    cssText,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: convert to JPEG with low quality", async () => {
  const outputFilename = resolve(outputDir, "test-node-4.jpeg");

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
    quality: 60,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: convert to WEBP with base64 and blob", async () => {
  const base64Res = await mdimg({
    inputFilename: inputFilenameTest,
    type: "webp",
    encoding: "base64",
  });
  const blobRes = await mdimg({
    inputFilename: inputFilenameTest,
    type: "webp",
    encoding: "blob",
  });

  expect(typeof base64Res.data).toBe("string");
  expect(blobRes.data instanceof Uint8Array).toBe(true);

  expect(() => {
    writeFileSync(resolve(outputDir, "test-node-5.webp"), base64Res.data, {
      encoding: "base64",
    });
  }).not.toThrow();
  expect(() => {
    writeFileSync(resolve(outputDir, "test-node-6.webp"), blobRes.data);
  }).not.toThrow();
});
