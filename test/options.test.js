const { readdirSync, writeFileSync } = require("fs");
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

test("OPTIONS: empty CSS overrides the preset instead of using default styles", async () => {
  const result = await mdimg({ ...htmlOptions(), cssText: "" });
  expect(result.html).toMatch(/<style>\s*<\/style>/);
});
