/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync, spawnSync } = require("child_process");
const { readFileSync, readdirSync } = require("fs");
const { resolve } = require("path");
const { useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const cliFilename = resolve(__dirname, "../bin/mdimg.js");
const workspace = useWorkspace();
const expectImage = useImageAssertions();

const runCli = (args) =>
  execFileSync(process.execPath, [cliFilename, ...args], {
    cwd: workspace.dir,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  });

const inputArgs = () => [
  "-i",
  workspace.inputFilename,
  "--extensions",
  "false",
];

test("CLI: base conversion writes a readable PNG", async () => {
  const outputFilename = resolve(workspace.dir, "base.png");
  const stdout = runCli([...inputArgs(), "-o", outputFilename]);
  expect(stdout.length).toBe(0);
  await expectImage(readFileSync(outputFilename), "png");
});

test("CLI: github CSS preset respects the requested width", async () => {
  const outputFilename = resolve(workspace.dir, "github.png");
  runCli([
    ...inputArgs(),
    "-o",
    outputFilename,
    "-w",
    "1000",
    "--css",
    "github",
  ]);
  await expectImage(readFileSync(outputFilename), "png", { width: 1000 });
});

test("CLI: template text and quoted paths affect rendered pixels", async () => {
  const htmlText =
    '<div id="mdimg-body"><div class="markdown-body"></div></div>';
  const cssText =
    'body { margin: 0; } #mdimg-body { height: 200px; background: rgb(10, 20, 30); color: white; } h1 { margin: 0; } .markdown-body::after { content: "it\'s quoted & < >"; }';
  const outputFilename = resolve(workspace.dir, "template text & 'quoted'.png");
  runCli([
    ...inputArgs(),
    "-o",
    outputFilename,
    "-w",
    "320",
    "--htmlText",
    htmlText,
    "--cssText",
    cssText,
  ]);
  await expectImage(readFileSync(outputFilename), "png", {
    width: 320,
    height: 200,
    pixel: [10, 20, 30, 255],
  });
});

test("CLI: output extension selects JPEG with low quality", async () => {
  const outputFilename = resolve(workspace.dir, "low-quality.jpeg");
  runCli([...inputArgs(), "-o", outputFilename, "--type", "png", "-q", "60"]);
  await expectImage(readFileSync(outputFilename), "jpeg");
});

test.each(["base64", "blob"])(
  "CLI: WEBP %s stdout contains only a readable image",
  async (encoding) => {
    const stdout = runCli([...inputArgs(), "--type", "webp", "-e", encoding]);
    let data = stdout;
    if (encoding === "base64") {
      const base64 = stdout.toString("utf8");
      expect(base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      data = Buffer.from(base64, "base64");
    }
    await expectImage(data, "webp");
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test("CLI: conversion failures return a nonzero exit code and no image", () => {
  const result = spawnSync(
    process.execPath,
    [cliFilename, "-i", resolve(workspace.dir, "missing.md")],
    { cwd: workspace.dir, encoding: "utf8", timeout: 30000 },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain("input file");
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test.each(["--help", "-h", "--version"])(
  "CLI: explicitly requested %s exits successfully",
  (flag) => {
    const result = spawnSync(process.execPath, [cliFilename, flag], {
      encoding: "utf8",
      timeout: 30000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
    expect(result.stderr).toBe("");
  },
);

test.each([
  [[], /text or file is required/],
  [["-t", ""], /text or file is required/],
  [["-i", ""], /inputFilename/],
  [["-t", "# Hello", "-w", "abc"], /width/],
  [["-t", "# Hello", "-w", "NaN"], /width/],
  [["-t", "# Hello", "-w", "Infinity"], /width/],
  [["-t", "# Hello", "-w", "0"], /width/],
  [["-t", "# Hello", "-w", "1.5"], /width/],
  [["-t", "# Hello", "-w", ""], /width/],
  [["-t", "# Hello", "-w", " "], /width/],
  [["-t", "# Hello", "--height", "99"], /height/],
  [["-t", "# Hello", "-q", "101"], /quality/],
  [["-t", "# Hello", "-q", ""], /quality/],
  [["-t", "# Hello", "--theme", "sepia"], /theme/],
  [["-t", "# Hello", "--type", "gif"], /type/],
  [["-t", "# Hello", "-e", "hex"], /encoding/],
  [["-t", "# Hello", "--extensions", "null"], /extensions/],
  [["-t", "# Hello", "--extensions", "[]"], /extensions/],
  [["-t", "# Hello", "--extensions", "123"], /extensions/],
  [["-t", "# Hello", "--extensions", '{"mermaid":null}'], /extensions/],
  [["-t", "# Hello", "--extensions", "{"], /extensions/],
  [["-t", "# Hello", "--html", ""], /htmlTemplate/],
  [["-t", "# Hello", "--template", ""], /Template/],
  [["--unknown"], /unknown option/],
  [["--width"], /argument missing/],
])("CLI: invalid arguments %j fail with diagnostics only", (args, error) => {
  const result = spawnSync(process.execPath, [cliFilename, ...args], {
    cwd: workspace.dir,
    encoding: "utf8",
    timeout: 30000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).toMatch(error);
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("CLI: zero JPEG quality stays lower than quality 100", async () => {
  const args = [...inputArgs(), "--type", "jpeg", "-e", "blob", "-w", "320"];
  const low = runCli([...args, "-q", "0"]);
  const high = runCli([...args, "-q", "100"]);
  expect(low.length).toBeLessThan(high.length);
  await expectImage(low, "jpeg", { width: 320 });
});
