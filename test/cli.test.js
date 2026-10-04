/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync } = require("child_process");
const { dirname, join, resolve } = require("path");
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("fs");
const { tmpdir } = require("os");

const inputFilenameTest = resolve(__dirname, "./static/test.md");
const cliFilename = resolve(__dirname, "../bin/mdimg.js");
const htmlTemplateFilename = resolve(__dirname, "./static/default-cli.html");
let outputDir;

beforeAll(() => {
  outputDir = mkdtempSync(join(tmpdir(), "mdimg CLI & quotes-"));
});

afterAll(() => {
  if (outputDir && dirname(outputDir) === tmpdir()) {
    rmSync(outputDir, { recursive: true, force: true });
  }
});

const runCli = (args) =>
  execFileSync(process.execPath, [cliFilename, ...args], {
    cwd: resolve(__dirname, ".."),
  });

test("CLI: base convert", async () => {
  expect(() =>
    runCli([
      "-i",
      inputFilenameTest,
      "-o",
      resolve(outputDir, "test-cli-base.png"),
      "--html",
      htmlTemplateFilename,
    ]),
  ).not.toThrow();
});

test("CLI: with `github` CSS preset", async () => {
  expect(() =>
    runCli([
      "-i",
      inputFilenameTest,
      "-o",
      resolve(outputDir, "test-cli-github.png"),
      "--html",
      htmlTemplateFilename,
      "-w",
      "1000",
      "--css",
      "github",
    ]),
  ).not.toThrow();
});

test("CLI: with no extensions", async () => {
  expect(() =>
    runCli([
      "-i",
      inputFilenameTest,
      "-o",
      resolve(outputDir, "test-cli-no-extensions.png"),
      "--html",
      htmlTemplateFilename,
      "-w",
      "1000",
      "--css",
      "github",
      "--extensions",
      "false",
    ]),
  ).not.toThrow();
});

test("CLI: with template text", async () => {
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div><script>MathJax = { tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]] }}</script>';
  const cssText =
    '.markdown-body { padding: 6rem 4rem; } .markdown-body::after { content: "it\'s quoted & < >"; }';
  const outputFilename = resolve(outputDir, "template text & 'quoted'.png");

  expect(() =>
    runCli([
      "-i",
      inputFilenameTest,
      "-o",
      outputFilename,
      "--htmlText",
      htmlText,
      "--cssText",
      cssText,
      "--extensions",
      "false",
    ]),
  ).not.toThrow();
  expect(readFileSync(outputFilename).subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
});

test("CLI: convert to JPEG with low quality", async () => {
  expect(() =>
    runCli([
      "-i",
      inputFilenameTest,
      "-o",
      resolve(outputDir, "test-cli-low-quality.jpeg"),
      "--html",
      htmlTemplateFilename,
      "-q",
      "60",
    ]),
  ).not.toThrow();
});

test("CLI: convert to WEBP with base64 and blob", async () => {
  expect(() => {
    const base64Res = runCli([
      "-i",
      inputFilenameTest,
      "--html",
      htmlTemplateFilename,
      "--type",
      "webp",
      "-e",
      "base64",
    ]).toString();
    writeFileSync(resolve(outputDir, "test-cli-base64.webp"), base64Res, {
      encoding: "base64",
    });
  }).not.toThrow();

  expect(() => {
    const blobRes = runCli([
      "-i",
      inputFilenameTest,
      "--html",
      htmlTemplateFilename,
      "--type",
      "webp",
      "-e",
      "blob",
    ]);
    writeFileSync(resolve(outputDir, "test-cli-blob.webp"), blobRes);
  }).not.toThrow();
});
