const { execFileSync, spawnSync } = require("child_process");
const { load } = require("cheerio");
const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { pathToFileURL } = require("node:url");
const puppeteer = requirePackage(__filename)("puppeteer");
const { findBrowser, prepareOfflinePage } = require("./helpers/browser");
const { waitForReady } = require("./helpers/offline-assertions");
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

test("CLI: valid extension JSON enables single-dollar MathJax rendering", async () => {
  writeFileSync(workspace.inputFilename, "$x+1$");
  const outputFilename = resolve(workspace.dir, "inline-math.png");
  const result = spawnSync(
    process.execPath,
    [
      cliFilename,
      "-i",
      workspace.inputFilename,
      "-o",
      outputFilename,
      "--debug",
      "--extensions",
      JSON.stringify({
        highlightJs: false,
        mermaid: false,
        mathJax: { tex: { inlineMath: [["$", "$"]] } },
      }),
    ],
    { cwd: workspace.dir, encoding: "utf8", timeout: 30000 },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toBe("");
  await expectImage(readFileSync(outputFilename), "png");
  const temporary = readdirSync(workspace.dir).filter((file) =>
    file.startsWith(".mdimg_temp_"),
  );
  expect(temporary).toHaveLength(1);
  const browser = await puppeteer.launch({
    executablePath: await findBrowser(),
    args: ["--no-sandbox"],
  });
  const externalRequests = [],
    pageErrors = [],
    consoleErrors = [];
  try {
    const page = await browser.newPage();
    await prepareOfflinePage(page, externalRequests, pageErrors, {
      consoleErrors,
    });
    await page.goto(pathToFileURL(resolve(workspace.dir, temporary[0])).href);
    await waitForReady(page);
    expect(
      await page.$$eval('mjx-container[jax="SVG"]', (nodes) => nodes.length),
    ).toBe(1);
    expect(
      await page.$$eval("mjx-container path[d]", (nodes) => nodes.length),
    ).toBeGreaterThan(0);
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await browser.close();
  }
});

test.each([
  {
    name: "Markdown text",
    text: "# CLI-Markdown-marker",
    selector: "h1",
    content: "CLI-Markdown-marker",
    breaks: 0,
  },
  {
    name: "literal backslash n",
    text: "CLI-literal-marker\\nSecond-line-marker",
    selector: "p",
    content: "CLI-literal-marker\\nSecond-line-marker",
    breaks: 0,
  },
  {
    name: "HTML line break",
    text: '<p data-input="cli-html-marker">CLI-first-marker<br>CLI-second-marker</p>',
    selector: 'p[data-input="cli-html-marker"]',
    content: "CLI-first-markerCLI-second-marker",
    breaks: 1,
  },
])(
  "CLI: -t renders $name with correct DOM and diagnostics",
  async ({ text, selector, content, breaks }) => {
    const outputFilename = resolve(workspace.dir, "text.png");
    const result = spawnSync(
      process.execPath,
      [
        cliFilename,
        "-t",
        text,
        "-o",
        outputFilename,
        "-w",
        "320",
        "--css",
        "empty",
        "--extensions",
        "false",
        "--debug",
      ],
      { cwd: workspace.dir, encoding: "utf8", timeout: 30000 },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/Info: start to convert text/);
    expect(result.stderr).toMatch(/Success: convert to image/);
    const temporaryFiles = readdirSync(workspace.dir).filter(
      (name) => name.startsWith(".mdimg_temp_") && name.endsWith(".html"),
    );
    expect(temporaryFiles).toHaveLength(1);
    const $ = load(
      readFileSync(resolve(workspace.dir, temporaryFiles[0]), "utf8"),
    );
    expect($(`#mdimg-body .markdown-body ${selector}`).text()).toBe(content);
    expect($("#mdimg-body .markdown-body br")).toHaveLength(breaks);
    await expectImage(readFileSync(outputFilename), "png", {
      width: 320,
      height: 100,
    });
  },
);

test("CLI: HTML file input takes priority over conflicting -t text", async () => {
  const inputFilename = resolve(workspace.dir, "priority.html");
  const outputFilename = resolve(workspace.dir, "priority.png");
  writeFileSync(
    inputFilename,
    '<section data-input="cli-file-marker"><h1>CLI-file-priority-marker</h1><p>File<br>HTML</p></section>',
  );
  runCli([
    "-i",
    inputFilename,
    "-t",
    "# Ignored-CLI-text-marker",
    "-o",
    outputFilename,
    "--extensions",
    "false",
    "--debug",
  ]);
  const temporaryFiles = readdirSync(workspace.dir).filter(
    (name) => name.startsWith(".mdimg_temp_") && name.endsWith(".html"),
  );
  expect(temporaryFiles).toHaveLength(1);
  const $ = load(
    readFileSync(resolve(workspace.dir, temporaryFiles[0]), "utf8"),
  );
  const section = $(
    '#mdimg-body .markdown-body section[data-input="cli-file-marker"]',
  );
  expect(section).toHaveLength(1);
  expect(section.find("h1").text()).toBe("CLI-file-priority-marker");
  expect(section.find("p br")).toHaveLength(1);
  expect($(".markdown-body").text()).not.toContain("Ignored-CLI-text-marker");
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

test("CLI: template text overrides local files and preserves quoted paths", async () => {
  const htmlTemplate = resolve(workspace.dir, "ignored & 'quoted'.html");
  const cssTemplate = resolve(workspace.dir, "ignored & 'quoted'.css");
  writeFileSync(
    htmlTemplate,
    '<div id="mdimg-body"><div class="markdown-body"></div><p>Ignored-CLI-HTML-marker</p></div>',
  );
  writeFileSync(
    cssTemplate,
    "/* Ignored-CLI-CSS-marker */ #mdimg-body { height: 450px; background: red; }",
  );
  const htmlText =
    '<div id="mdimg-body"><article class="markdown-body"><p>Obsolete-CLI-text-marker</p></article></div>';
  const cssText =
    'body { margin: 0; } #mdimg-body { height: 200px; background: rgb(10, 20, 30); color: white; } h1 { margin: 0; } .markdown-body::after { content: "it\'s quoted & < >"; }';
  const outputFilename = resolve(workspace.dir, "template text & 'quoted'.png");
  runCli([
    ...inputArgs(),
    "-o",
    outputFilename,
    "-w",
    "320",
    "--html",
    htmlTemplate,
    "--css",
    cssTemplate,
    "--htmlText",
    htmlText,
    "--cssText",
    cssText,
    "--debug",
  ]);
  const temporaryFiles = readdirSync(workspace.dir).filter(
    (name) => name.startsWith(".mdimg_temp_") && name.endsWith(".html"),
  );
  expect(temporaryFiles).toHaveLength(1);
  const $ = load(
    readFileSync(resolve(workspace.dir, temporaryFiles[0]), "utf8"),
  );
  expect($("#mdimg-body > article.markdown-body h1").text()).toBe("Hello");
  expect($(".markdown-body").text()).not.toContain("Obsolete-CLI-text-marker");
  expect($("body").text()).not.toContain("Ignored-CLI-HTML-marker");
  expect($("style").text()).not.toContain("Ignored-CLI-CSS-marker");
  expect($("style").text()).toContain("it's quoted & < >");
  await expectImage(readFileSync(outputFilename), "png", {
    width: 320,
    height: 200,
    pixel: [10, 20, 30, 255],
  });
});

test("CLI: local HTML and CSS replace old content and crop to mdimg-body", async () => {
  const htmlTemplate = resolve(workspace.dir, "local & 'quoted'.html");
  const cssTemplate = resolve(workspace.dir, "local & 'quoted'.css");
  const outputFilename = resolve(workspace.dir, "local.png");
  writeFileSync(
    htmlTemplate,
    '<aside id="outside">Outside-CLI-local-marker</aside><section id="mdimg-body"><article class="markdown-body"><p>Obsolete-CLI-local-marker</p></article></section>',
  );
  writeFileSync(
    cssTemplate,
    "body { margin: 0; background: red; } #outside { width: 900px; height: 360px; background: blue; } #mdimg-body { width: 240px; height: 180px; background: rgb(30, 40, 50); color: white; } h1 { margin: 0; }",
  );
  runCli([
    ...inputArgs(),
    "-o",
    outputFilename,
    "-w",
    "320",
    "--html",
    htmlTemplate,
    "--css",
    cssTemplate,
    "--debug",
  ]);
  const temporaryFiles = readdirSync(workspace.dir).filter(
    (name) => name.startsWith(".mdimg_temp_") && name.endsWith(".html"),
  );
  expect(temporaryFiles).toHaveLength(1);
  const $ = load(
    readFileSync(resolve(workspace.dir, temporaryFiles[0]), "utf8"),
  );
  expect($("#mdimg-body > article.markdown-body h1").text()).toBe("Hello");
  expect($("#outside").text()).toBe("Outside-CLI-local-marker");
  expect($(".markdown-body").text()).not.toContain("Obsolete-CLI-local-marker");
  await expectImage(readFileSync(outputFilename), "png", {
    width: 240,
    height: 180,
    pixel: [30, 40, 50, 255],
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
