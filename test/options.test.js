const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const puppeteer = requirePackage(__filename)("puppeteer").default;
const { mdimg, createHtmlOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const htmlOptions = () => ({
  inputText: "# Hello",
  extensions: false,
  outputProcessor: createHtmlOutputProcessor(),
});

test.each([
  ["width", NaN],
  ["width", Infinity],
  ["width", -Infinity],
  ["width", 0],
  ["width", -1],
  ["width", 1.5],
  ["width", Number.MAX_SAFE_INTEGER + 1],
  ["width", "800"],
  ["width", null],
  ["height", NaN],
  ["height", Infinity],
  ["height", 99],
  ["height", 100.5],
  ["height", Number.MAX_SAFE_INTEGER + 1],
  ["quality", NaN],
  ["quality", Infinity],
  ["quality", -1],
  ["quality", 101],
  ["quality", 0.5],
  ["quality", null],
  ["type", "gif"],
  ["encoding", "hex"],
  ["extensions", null],
  ["extensions", []],
  ["extensions", "false"],
  ["extensions", 0],
  ["extensions", { highlightJs: null }],
  ["extensions", { mathJax: [] }],
  ["extensions", { mermaid: "true" }],
  ["extensions", { custom: 1 }],
  ["plugins", null],
  ["plugins", {}],
  ["plugins", Array(1)],
  ["plugins", [null]],
  ["plugins", [{}]],
  ["plugins", [{ name: "" }]],
  ["plugins", [{ name: "plugin", hooks: [] }]],
  ["plugins", [{ name: "plugin", hooks: { beforeParse: true } }]],
  ["plugins", [{ name: "plugin", extensions: {} }]],
  ["plugins", [{ name: "plugin", extensions: Array(1) }]],
  ["plugins", [{ name: "plugin", extensions: [null] }]],
  ["plugins", [{ name: "plugin", extensions: [{ name: "ext" }] }]],
  ["plugins", [{ name: "plugin", markedExtensions: {} }]],
  ["plugins", [{ name: "plugin", markedExtensions: Array(1) }]],
  ["plugins", [{ name: "plugin", markedExtensions: [null] }]],
  ["outputProcessor", null],
  ["outputProcessor", {}],
  ["outputProcessor", { format: "html", process: true }],
  ["puppeteerProps", null],
  ["puppeteerProps", []],
  ["puppeteerProps", { args: "--no-sandbox" }],
  ["puppeteerProps", { args: [true] }],
  ["puppeteerProps", { args: Array(1) }],
  ["log", "false"],
  ["debug", 1],
  ["inputFilename", ""],
  ["outputFilename", ""],
  ["input", ""],
  ["input", null],
  ["output", ""],
  ["output", 42],
  ["css", null],
  ["css", []],
  ["css", 42],
  ["css", { body: "color: red" }],
  ["css", { body: { color: null } }],
  ["css", { body: { opacity: NaN } }],
  ["html", ""],
  ["html", null],
  ["html", {}],
  ["htmlTemplate", ""],
  ["cssTemplate", ""],
  ["htmlText", ""],
  ["cssText", null],
])("OPTIONS: rejects invalid %s (%j)", async (key, value) => {
  await expect(mdimg({ ...htmlOptions(), [key]: value })).rejects.toThrow(key);
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test.each([undefined, null, [], "text"])(
  "OPTIONS: requires an options object (%j)",
  async (options) => {
    await expect(mdimg(options)).rejects.toThrow(/options.*object/i);
  },
);

test("OPTIONS: missing input rejects without writing files", async () => {
  await expect(mdimg({})).rejects.toThrow(/text or file is required/);
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("OPTIONS: input files take priority over conflicting text", async () => {
  writeFileSync(workspace.inputFilename, "# File-priority-marker");
  const result = await mdimg({
    ...htmlOptions(),
    inputFilename: workspace.inputFilename,
    inputText: "# Ignored-text-marker",
  });
  expect(result.html).toContain("<h1>File-priority-marker</h1>");
  expect(result.html).not.toContain("Ignored-text-marker");
});

test("OPTIONS: invalid options fail before hooks and browser launch", async () => {
  const launch = jest
    .spyOn(puppeteer, "launch")
    .mockRejectedValue(new Error("browser launched"));
  const beforeParse = jest.fn((text) => text);
  try {
    await expect(
      mdimg({
        inputText: "# Hello",
        extensions: false,
        width: NaN,
        plugins: [{ name: "observer", hooks: { beforeParse } }],
      }),
    ).rejects.toThrow("width");
    expect(beforeParse).not.toHaveBeenCalled();
    expect(launch).not.toHaveBeenCalled();
  } finally {
    launch.mockRestore();
  }
});

test("OPTIONS: empty text is rejected alone and ignored when a file is provided", async () => {
  await expect(mdimg({ ...htmlOptions(), inputText: "" })).rejects.toThrow(
    /text or file is required/,
  );
  const result = await mdimg({
    ...htmlOptions(),
    inputFilename: workspace.inputFilename,
    inputText: "",
  });
  expect(result.html).toContain("<h1>Hello</h1>");
});

test("OPTIONS: whitespace text and empty files remain valid input", async () => {
  const textResult = await mdimg({ ...htmlOptions(), inputText: " " });
  expect(textResult.html).toContain('<div class="markdown-body"></div>');
  writeFileSync(workspace.inputFilename, "");
  const fileResult = await mdimg({
    ...htmlOptions(),
    inputFilename: workspace.inputFilename,
  });
  expect(fileResult.html).toContain('<div class="markdown-body"></div>');
});

test("OPTIONS: empty CSS additions preserve the selected preset", async () => {
  const baseline = await mdimg(htmlOptions());
  const result = await mdimg({ ...htmlOptions(), css: "", cssText: "" });
  expect(result.html).toBe(baseline.html);
});

test("OPTIONS: html and css aliases render text and append styles", async () => {
  const result = await mdimg({
    ...htmlOptions(),
    html: '<section id="mdimg-body"><article class="markdown-body"></article></section>',
    css: "/* alias styles */ .markdown-body { color: red; }",
  });
  expect(result.html).toContain('<section id="mdimg-body">');
  expect(result.html).toContain(
    '<article class="markdown-body"><h1>Hello</h1>',
  );
  expect(result.html).toContain("/* alias styles */");
});

test("OPTIONS: htmlText and cssText take priority over their aliases", async () => {
  const result = await mdimg({
    ...htmlOptions(),
    html: '<section id="mdimg-body"><article class="markdown-body"></article></section>',
    htmlText: '<main id="mdimg-body"><div class="markdown-body"></div></main>',
    css: "/* ignored alias */ .markdown-body { color: red; }",
    cssText: "/* canonical styles */ .markdown-body { color: blue; }",
  });
  expect(result.html).toContain('<main id="mdimg-body">');
  expect(result.html).not.toContain("<section");
  expect(result.html).toContain("/* canonical styles */");
  expect(result.html).not.toContain("/* ignored alias */");
});

test("OPTIONS: explicit empty cssText takes priority over css", async () => {
  const baseline = await mdimg(htmlOptions());
  const result = await mdimg({
    ...htmlOptions(),
    css: "/* ignored alias */ .markdown-body { color: red; }",
    cssText: "",
  });
  expect(result.html).toBe(baseline.html);
});

test("OPTIONS: input and output aliases read and save files", async () => {
  writeFileSync(workspace.inputFilename, "# Alias-file-marker");
  const output = resolve(workspace.dir, "alias.html");
  const result = await mdimg({
    ...htmlOptions(),
    inputText: undefined,
    input: workspace.inputFilename,
    output,
  });
  expect(result.html).toContain("<h1>Alias-file-marker</h1>");
  expect(result.path).toBe(output);
  expect(readFileSync(output, "utf8")).toBe(result.html);
});

test("OPTIONS: original filenames take priority over aliases", async () => {
  const outputFilename = resolve(workspace.dir, "original.html");
  const result = await mdimg({
    ...htmlOptions(),
    inputFilename: workspace.inputFilename,
    input: resolve(workspace.dir, "missing.md"),
    outputFilename,
    output: resolve(workspace.dir, "ignored.html"),
  });
  expect(result.html).toContain("<h1>Hello</h1>");
  expect(result.path).toBe(outputFilename);
  expect(readdirSync(workspace.dir).sort()).toEqual([
    "input.md",
    "original.html",
  ]);
});
