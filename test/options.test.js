/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

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
  ["width", "800"],
  ["width", null],
  ["height", NaN],
  ["height", Infinity],
  ["height", 99],
  ["height", 100.5],
  ["quality", NaN],
  ["quality", Infinity],
  ["quality", -1],
  ["quality", 101],
  ["quality", 0.5],
  ["quality", null],
  ["theme", "sepia"],
  ["theme", ""],
  ["theme", null],
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

test.each([
  [{ inputText: "", mdText: "# Legacy" }, /text or file is required/],
  [{ inputFilename: "", mdFile: "input.md" }, /inputFilename/],
])(
  "OPTIONS: empty new input fields do not fall back to aliases (%j)",
  async (input, error) => {
    await expect(mdimg({ ...htmlOptions(), ...input })).rejects.toThrow(error);
  },
);

test("OPTIONS: files take priority over text and new fields over aliases", async () => {
  const result = await mdimg({
    ...htmlOptions(),
    inputFilename: workspace.inputFilename,
    mdFile: resolve(workspace.dir, "missing.md"),
    inputText: "# Ignored",
    mdText: "# Legacy",
  });
  expect(result.html).toContain("<h1>Hello</h1>");
  expect(result.html).not.toContain("Ignored");
  expect(result.html).not.toContain("Legacy");

  const textResult = await mdimg({
    ...htmlOptions(),
    inputText: "# Modern",
    mdText: "# Legacy",
  });
  expect(textResult.html).toContain("<h1>Modern</h1>");
  expect(textResult.html).not.toContain("Legacy");
});

test("OPTIONS: legacy aliases still provide input when new fields are omitted", async () => {
  const textResult = await mdimg({
    ...htmlOptions(),
    inputText: undefined,
    mdText: "# Legacy",
  });
  expect(textResult.html).toContain("<h1>Legacy</h1>");
  const fileResult = await mdimg({
    ...htmlOptions(),
    inputText: "# Ignored",
    mdFile: workspace.inputFilename,
  });
  expect(fileResult.html).toContain("<h1>Hello</h1>");
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

test("OPTIONS: JPEG quality zero reaches the screenshot instead of defaulting to 100", async () => {
  const options = {
    inputFilename: workspace.inputFilename,
    extensions: false,
    type: "jpeg",
    encoding: "blob",
    width: 320,
  };
  const low = await mdimg({ ...options, quality: 0 });
  const high = await mdimg({ ...options, quality: 100 });
  expect(Buffer.from(low.data).length).toBeLessThan(
    Buffer.from(high.data).length,
  );
  expect(readFileSync(workspace.inputFilename, "utf8")).toContain("# Hello");
});
