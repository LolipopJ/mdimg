const fs = require("fs");
const { dirname, resolve } = require("path");
const { fileURLToPath, pathToFileURL } = require("url");
const nativeProcess = requirePackage(__filename)("node:process");
const puppeteer = requirePackage(__filename)("puppeteer").default;
const { mdimg } = requirePackage(__filename)("../lib/mdimg.js");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();

afterEach(() => jest.restoreAllMocks());

test.each([
  ["outputFilename", true, "file"],
  ["output", true, "file"],
  [undefined, true, "file"],
  ["outputFilename", false, "file"],
  [undefined, false, "file"],
  [undefined, true, "text"],
])(
  "DEBUG: %s directory and retention (debug=%s, %s)",
  async (outputKey, debug, inputType) => {
    if (inputType === "text") {
      jest.spyOn(nativeProcess, "cwd").mockReturnValue(workspace.dir);
    }
    let temporary;
    const close = jest.fn();
    jest.spyOn(puppeteer, "launch").mockReturnValue({
      close,
      newPage: () => ({
        on() {},
        goto: (url) => {
          temporary = fileURLToPath(url);
          expect(fs.readFileSync(temporary, "utf8")).toContain(
            "<h1>Hello</h1>",
          );
        },
        evaluate: () => {},
        $: () => ({}),
      }),
    });
    const stderr = jest.spyOn(process.stderr, "write");
    const outputFilename = resolve(
      workspace.dir,
      "new output & 'quotes'",
      "out.txt",
    );
    await mdimg({
      ...(inputType === "text"
        ? { inputText: "# Hello" }
        : { inputFilename: workspace.inputFilename }),
      ...(outputKey ? { [outputKey]: outputFilename } : {}),
      extensions: false,
      debug,
      log: false,
      outputProcessor: {
        format: "txt",
        process: () => ({ data: "done" }),
      },
    });

    expect(dirname(temporary)).toBe(
      outputKey ? dirname(outputFilename) : workspace.dir,
    );
    expect(fs.existsSync(temporary)).toBe(debug);
    const debugMessages = stderr.mock.calls.filter(([message]) =>
      String(message).startsWith("Debug: temporary HTML file saved at "),
    );
    expect(debugMessages).toHaveLength(debug ? 1 : 0);
    if (debug) expect(debugMessages[0][0]).toContain(temporary);
    expect(close).toHaveBeenCalledTimes(1);
  },
);

test.each([false, true])(
  "DEBUG: relocated HTML resolves images and respects template base=%s",
  async (customBase) => {
    fs.writeFileSync(workspace.inputFilename, '<img src="./local.svg">');
    fs.writeFileSync(
      resolve(workspace.dir, "local.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"></svg>',
    );
    const output = resolve(workspace.dir, "nested", "image.txt");
    const assets = resolve(workspace.dir, "assets");
    fs.mkdirSync(assets);
    fs.writeFileSync(
      resolve(assets, "local.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="10"></svg>',
    );
    await mdimg({
      input: workspace.inputFilename,
      output,
      extensions: false,
      ...(customBase
        ? {
            htmlText: `<head><base href="${pathToFileURL(assets + "/").href}"></head><body id="mdimg-body"><div class="markdown-body"></div></body>`,
          }
        : {}),
      outputProcessor: {
        format: "txt",
        async process({ page }) {
          expect(await page.$eval("img", (image) => image.naturalWidth)).toBe(
            customBase ? 30 : 20,
          );
          return { data: "rendered" };
        },
      },
    });
    expect(fs.readFileSync(output, "utf8")).toBe("rendered");
  },
);
