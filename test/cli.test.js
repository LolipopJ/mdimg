/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execSync } = require("child_process");
const { resolve } = require("path");
const { writeFileSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "./static/test.md");
const outputDir = resolve(__dirname, "../mdimg_output");
const htmlTemplateFilename = resolve(__dirname, "./static/default-cli.html");

test("CLI: base convert", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-base.png")} --html ${htmlTemplateFilename}`,
    ),
  ).not.toThrow();
});

test("CLI: with `github` CSS preset", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-github.png")} --html ${htmlTemplateFilename} -w 1000 --css github`,
    ),
  ).not.toThrow();
});

test("CLI: with no extensions", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-no-extensions.png")} --html ${htmlTemplateFilename} -w 1000 --css github --extensions false`,
    ),
  ).not.toThrow();
});

test("CLI: with template text", async () => {
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div><script>MathJax = { tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]] }}</script>';
  const cssText =
    '@import "https://cdn.jsdelivr.net/npm/normalize.css/normalize.min.css"; .markdown-body { padding: 6rem 4rem; }';

  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-template-text.png")} --htmlText '${htmlText}' --cssText '${cssText}'`,
    ),
  ).not.toThrow();
});

test("CLI: convert to JPEG with low quality", async () => {
  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${resolve(outputDir, "test-cli-low-quality.jpeg")} --html ${htmlTemplateFilename} -q 60`,
    ),
  ).not.toThrow();
});

test("CLI: convert to WEBP with base64 and blob", async () => {
  expect(() => {
    const base64Res = execSync(
      `node bin/mdimg -i ${inputFilenameTest} --html ${htmlTemplateFilename} --type webp -e base64`,
    ).toString();
    writeFileSync(resolve(outputDir, "test-cli-base64.webp"), base64Res, {
      encoding: "base64",
    });
  }).not.toThrow();

  expect(() => {
    const blobRes = execSync(
      `node bin/mdimg -i ${inputFilenameTest} --html ${htmlTemplateFilename} --type webp -e blob`,
    );
    writeFileSync(resolve(outputDir, "test-cli-blob.webp"), blobRes);
  }).not.toThrow();
});
