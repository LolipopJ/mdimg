#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { resolve } = require("path");
const { mdimg } = require("../lib/mdimg.js");

const outputDir = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(__dirname, "../docs", process.platform);
const defaultOptions = {
  inputFilename: resolve(__dirname, "../test/static/test.md"),
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
};
const previews = [
  { name: "default" },
  { name: "empty", cssTemplate: "empty" },
  { name: "github", cssTemplate: "github", width: 1000 },
  { name: "githubDark", cssTemplate: "githubDark", theme: "dark", width: 1000 },
  {
    name: "words",
    inputFilename: resolve(__dirname, "../test/static/testTemplateWords.md"),
    htmlTemplate: "words",
    cssTemplate: "words",
    width: 1200,
  },
];

async function generatePreviews() {
  for (const { name, ...options } of previews) {
    const outputFilename = resolve(outputDir, `${name}.png`);
    await mdimg({ ...defaultOptions, ...options, outputFilename });
    process.stdout.write(`Generated ${outputFilename}\n`);
  }
}

generatePreviews().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
