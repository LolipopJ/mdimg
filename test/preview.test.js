/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg } = require("../lib/mdimg.js");
const { resolve } = require("path");
const { existsSync, rmSync } = require("fs");

const inputFilenameTest = resolve(__dirname, "./static/test.md");
const inputFilenameTestTemplateWords = resolve(
  __dirname,
  "./static/testTemplateWords.md",
);

const outputDir = resolve(__dirname, "../docs", process.platform);
if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true });
}

const defaultOptions = {
  inputFilename: inputFilenameTest,
  htmlTemplate: "default",
  cssTemplate: "default",
  theme: "light",
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
  // debug: true,
};

test("Generate preview image with `default` template", async () => {
  const outputFilename = resolve(outputDir, "default.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Generate preview image with `empty` CSS template", async () => {
  const outputFilename = resolve(outputDir, "empty.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    cssTemplate: "empty",
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Generate preview image with `github` CSS template", async () => {
  const outputFilename = resolve(outputDir, "github.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    cssTemplate: "github",
    width: 1000,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Generate preview image with `githubDark` CSS template", async () => {
  const outputFilename = resolve(outputDir, "githubDark.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    outputFilename,
    cssTemplate: "githubDark",
    theme: "dark",
    width: 1000,
  });

  expect(convertRes.path).toBe(outputFilename);
});

test("Generate preview image with `words` template", async () => {
  const outputFilename = resolve(outputDir, "words.png");

  const convertRes = await mdimg({
    ...defaultOptions,
    inputFilename: inputFilenameTestTemplateWords,
    outputFilename,
    htmlTemplate: "words",
    cssTemplate: "words",
    width: 1200,
  });

  expect(convertRes.path).toBe(outputFilename);
});
