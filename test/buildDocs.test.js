const { mdimg } = require("../lib/mdimg.js");
const { resolve } = require("path");
const { existsSync, rmSync, readFileSync } = require("fs");
const { execSync } = require("child_process");

const inputFilenameTest = resolve(__dirname, "test.md");
const inputFilenameTestTemplateWords = resolve(
  __dirname,
  "testTemplateWords.md",
);
const outputDir = resolve(__dirname, "../docs");

if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true });
}

test("Convert to image with default template, using `inputText`, `htmlText` and `cssText`", async () => {
  const inputTextTest = readFileSync(inputFilenameTest);

  const htmlTemplateDefaultFilename = resolve(
    __dirname,
    "../template/html/default.html",
  );
  const htmlTemplateDefaultText = readFileSync(htmlTemplateDefaultFilename);

  const cssTemplateDefaultFilename = resolve(
    __dirname,
    "../template/css/default.css",
  );
  const cssTemplateDefaultText = readFileSync(cssTemplateDefaultFilename);

  const outputFilename = resolve(`${outputDir}/default.png`);

  const convertRes = await mdimg({
    inputText: inputTextTest,
    outputFilename,
    htmlText: htmlTemplateDefaultText,
    cssText: cssTemplateDefaultText,
    log: true,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Convert to image with `empty` CSS template, using command", async () => {
  const outputFilename = resolve(`${outputDir}/empty.png`);

  expect(() =>
    execSync(
      `node bin/mdimg -i ${inputFilenameTest} -o ${outputFilename} --css empty`,
    ),
  ).not.toThrow();
});

test("Convert to image with `github` CSS template", async () => {
  const outputFilename = resolve(`${outputDir}/github.png`);

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
    cssTemplate: "github",
    width: 1000,
    log: true,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Convert to image with `githubDark` CSS template", async () => {
  const outputFilename = resolve(`${outputDir}/githubDark.png`);

  const convertRes = await mdimg({
    inputFilename: inputFilenameTest,
    outputFilename,
    cssTemplate: "githubDark",
    width: 1000,
    log: true,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Convert to image with `words` template", async () => {
  const outputFilename = resolve(`${outputDir}/words.png`);

  const convertRes = await mdimg({
    inputFilename: inputFilenameTestTemplateWords,
    outputFilename,
    htmlTemplate: "words",
    cssTemplate: "words",
    width: 1200,
    log: true,
  });

  expect(convertRes.path).toBe(outputFilename);
});
