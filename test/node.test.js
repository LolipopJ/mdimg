/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg } = require("../lib/mdimg.js");
const { resolve } = require("path");
const { writeFileSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "./static/test.md");
const outputDir = resolve(__dirname, "../mdimg_output");
const defaultOptions = {
  inputFilename: inputFilenameTest,
  extensions: {
    mathJax: {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
      },
    },
  },
};

test("NODE: base convert", async () => {
  const outputFilename = resolve(outputDir, "test-node-base.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: with `github` CSS preset", async () => {
  const outputFilename = resolve(outputDir, "test-node-github.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    width: 1000,
    cssTemplate: "github",
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: with no extensions", async () => {
  const outputFilename = resolve(outputDir, "test-node-no-extensions.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    width: 1000,
    cssTemplate: "github",
    extensions: false,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: with template text", async () => {
  const outputFilename = resolve(outputDir, "test-node-template-text.png");
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div><script>MathJax = { tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]] }}</script>';
  const cssText =
    '@import "https://cdn.jsdelivr.net/npm/normalize.css/normalize.min.css"; .markdown-body { padding: 6rem 4rem; }';

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    htmlText,
    cssText,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: convert to JPEG with low quality", async () => {
  const outputFilename = resolve(outputDir, "test-node-low-quality.jpeg");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    quality: 60,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("NODE: convert to WEBP with base64 and blob", async () => {
  const base64Res = await mdimg({
    ...defaultOptions,
    type: "webp",
    encoding: "base64",
  });
  const blobRes = await mdimg({
    ...defaultOptions,
    type: "webp",
    encoding: "blob",
  });

  expect(typeof base64Res.data).toBe("string");
  expect(blobRes.data instanceof Uint8Array).toBe(true);

  expect(() => {
    writeFileSync(resolve(outputDir, "test-node-base64.webp"), base64Res.data, {
      encoding: "base64",
    });
  }).not.toThrow();
  expect(() => {
    writeFileSync(resolve(outputDir, "test-node-blob.webp"), blobRes.data);
  }).not.toThrow();
});
