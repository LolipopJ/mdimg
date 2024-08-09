/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execSync } = require("child_process");
const { resolve } = require("path");
const { writeFileSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "test.md");
const outputDir = resolve(__dirname, "../mdimg_output");

test("CLI: base convert", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-1.png")}`,
    ),
  ).not.toThrow();
});

test("CLI: with `github` CSS preset", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-2.png")} -w 600 --css github`,
    ),
  ).not.toThrow();
});

test("CLI: with template text", async () => {
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div>';
  const cssText =
    '@import "https://cdn.jsdelivr.net/npm/normalize.css/normalize.min.css"; .markdown-body { padding: 6rem 4rem; }';

  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-3.png")} --htmlText '${htmlText}' --cssText '${cssText}'`,
    ),
  ).not.toThrow();
});

test("CLI: convert to JPEG with low quality", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-4.jpeg")} -q 60`,
    ),
  ).not.toThrow();
});

test("CLI: convert to WEBP with base64 and blob", async () => {
  expect(() => {
    const base64Res = execSync(
      `node bin/mdimg -i ${inputFilenameTest} --type webp -e base64`,
    ).toString();
    writeFileSync(resolve(outputDir, "test-cli-5.webp"), base64Res, {
      encoding: "base64",
    });
  }).not.toThrow();

  expect(() => {
    const blobRes = execSync(
      `node bin/mdimg -i ${inputFilenameTest} --type webp -e blob`,
    );
    writeFileSync(resolve(outputDir, "test-cli-6.webp"), blobRes);
  }).not.toThrow();
});
