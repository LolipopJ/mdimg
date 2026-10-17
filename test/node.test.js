const { execFileSync } = require("child_process");
const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { load } = require("cheerio");
const { mdimg, createHtmlOutputProcessor, createImageOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const { expectMarkdown, useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const expectImage = useImageAssertions();
const options = () => ({
  inputFilename: workspace.inputFilename,
  extensions: false,
});

async function expectFile(result, outputFilename, format, dimensions) {
  expect(result.path).toBe(outputFilename);
  const onDisk = readFileSync(outputFilename);
  expect(onDisk).toEqual(Buffer.from(result.data));
  expectMarkdown(result.html);
  await expectImage(onDisk, format, dimensions);
}

test("NODE: base conversion renders Markdown to a readable PNG", async () => {
  const outputFilename = resolve(workspace.dir, "base.png");
  const processor = createImageOutputProcessor("png", undefined, "binary");
  const result = await mdimg({
    ...options(),
    outputFilename,
    outputProcessor: {
      ...processor,
      async process(context) {
        const extensions = await context.page.evaluate(() => ({
          tasks: globalThis.__mdimgTasks.map(({ name }) => name),
          highlighted: document.querySelectorAll(
            "code.hljs, code [class^=hljs-]",
          ).length,
        }));
        expect(extensions).toEqual({ tasks: [], highlighted: 0 });
        return processor.process(context);
      },
    },
  });
  expect(result.html).not.toMatch(/name: "(?:highlightJs|mathJax|mermaid)"/);
  await expectFile(result, outputFilename, "png");
});

test.each(["file", "text"])(
  "NODE: HTML %s input preserves elements and attributes",
  async (source) => {
    const marker = `node-html-${source}`;
    const inputText = `<section data-input="${marker}"><h1>${marker}</h1><p>First<br>Second <strong>bold</strong></p></section>`;
    const inputFilename = resolve(workspace.dir, `${marker}.html`);
    writeFileSync(inputFilename, inputText);
    const result = await mdimg({
      ...(source === "file" ? { inputFilename } : { inputText }),
      extensions: false,
      outputProcessor: createHtmlOutputProcessor(),
    });
    const $ = load(result.html);
    const section = $(
      `#mdimg-body .markdown-body section[data-input="${marker}"]`,
    );
    expect(section).toHaveLength(1);
    expect(section.find("h1").text()).toBe(marker);
    expect(section.find("p br")).toHaveLength(1);
    expect(section.find("p strong").text()).toBe("bold");
    expect(section.find("p").text()).toBe("FirstSecond bold");
    expect(result.data).toBe(result.html);
    expect(result.path).toBeUndefined();
  },
);

test("NODE: highlight.js renders code in the browser", async () => {
  let highlightedText;
  const processor = createImageOutputProcessor("png", undefined, "binary");
  const outputFilename = resolve(workspace.dir, "highlighted.png");
  const result = await mdimg({
    ...options(),
    outputFilename,
    extensions: { highlightJs: true, mathJax: false, mermaid: false },
    outputProcessor: {
      ...processor,
      async process(context) {
        highlightedText = await context.page.$eval(
          "code.hljs .hljs-string",
          (element) => element.textContent,
        );
        return processor.process(context);
      },
    },
  });
  expect(highlightedText).toBe("'hi'");
  await expectFile(result, outputFilename, "png");
});

test.each([
  { height: 100, paragraphs: 1, imageHeight: 100 },
  { height: 260, paragraphs: 1, imageHeight: 260 },
  { height: 260, paragraphs: 12, imageHeight: 480 },
])(
  "NODE: height $height is a minimum for $paragraphs paragraphs",
  async ({ height, paragraphs, imageHeight }) => {
    writeFileSync(
      workspace.inputFilename,
      Array.from(
        { length: paragraphs },
        (_, index) =>
          `<p style="margin:0;height:40px">Height ${height} row ${index}</p>`,
      ).join("\n"),
    );
    const result = await mdimg({
      ...options(),
      cssTemplate: "empty",
      width: 320,
      height,
      encoding: "blob",
    });
    const $ = load(result.html);
    expect($("#mdimg-body .markdown-body p")).toHaveLength(paragraphs);
    expect($("#mdimg-body p").first().text()).toBe(`Height ${height} row 0`);
    await expectImage(result.data, "png", { width: 320, height: imageHeight });
    expect(result.path).toBeUndefined();
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
  },
);

test("NODE: output extension selects JPEG even when type is PNG", async () => {
  const outputFilename = resolve(workspace.dir, "low-quality.jpeg");
  const result = await mdimg({
    ...options(),
    outputFilename,
    type: "png",
    quality: 60,
  });
  await expectFile(result, outputFilename, "jpeg");
});

test.each(["base64", "blob"])(
  "NODE: WEBP %s data decodes to the requested image without writing files",
  async (encoding) => {
    const result = await mdimg({ ...options(), type: "webp", encoding });
    if (encoding === "base64") {
      expect(typeof result.data).toBe("string");
      expect(result.data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    } else expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.path).toBeUndefined();
    expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
    expectMarkdown(result.html);
    const data =
      encoding === "base64" ? Buffer.from(result.data, "base64") : result.data;
    await expectImage(data, "webp");
  },
);

test("NODE: concurrent conversions keep input, output and temporary HTML isolated", async () => {
  const cases = [
    {
      name: "red",
      width: 240,
      color: "rgb(255, 0, 0)",
      pixel: [255, 0, 0, 255],
    },
    {
      name: "blue",
      width: 360,
      color: "rgb(0, 0, 255)",
      pixel: [0, 0, 255, 255],
    },
  ];
  const results = await Promise.all(
    cases.map(({ name, width, color }) => {
      const inputFilename = resolve(workspace.dir, `${name}.md`);
      writeFileSync(inputFilename, `# ${name}`);
      return mdimg({
        inputFilename,
        outputFilename: resolve(workspace.dir, `${name}.png`),
        extensions: false,
        width,
        cssTemplate: "empty",
        cssText: `body { margin: 0; } #mdimg-body { height: 100px; background: ${color}; } h1 { margin: 0; }`,
      });
    }),
  );
  for (const [index, { name, width, pixel }] of cases.entries()) {
    const result = results[index];
    expect(result.html).toContain(`<h1>${name}</h1>`);
    expect(result.path).toBe(resolve(workspace.dir, `${name}.png`));
    expect(readFileSync(result.path)).toEqual(Buffer.from(result.data));
    await expectImage(result.data, "png", { width, height: 100, pixel });
  }
  expect(readdirSync(workspace.dir).sort()).toEqual([
    "blue.md",
    "blue.png",
    "input.md",
    "red.md",
    "red.png",
  ]);
});

test("NODE: invalid HTML rejects without leaving temporary HTML or output files", async () => {
  await expect(
    mdimg({
      ...options(),
      outputFilename: resolve(workspace.dir, "invalid.png"),
      htmlText: '<div class="markdown-body"></div>',
    }),
  ).rejects.toThrow(/missing HTML element with id: mdimg-body/);
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test("NODE: default filenames remain unique in the same millisecond", async () => {
  const script = [
    `const { mdimg } = require(${JSON.stringify(resolve(__dirname, "../lib/mdimg.js"))});`,
    "const RealDate = Date;",
    "global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : ['2026-10-09T00:00:00.000Z'])); } };",
    "(async () => {",
    `const convert = () => mdimg(${JSON.stringify(options())});`,
    "const results = await Promise.all([convert(), convert()]);",
    "process.stdout.write(JSON.stringify(results.map(({ data, path }) => ({ data: Array.from(data), path }))));",
    "})();",
  ].join("\n");
  const results = JSON.parse(
    execFileSync(process.execPath, ["--eval", script], {
      cwd: workspace.dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    }),
  );

  expect(results[0].path).not.toBe(results[1].path);
  for (const result of results) {
    expect(result.path).toMatch(
      /mdimg_\d{4}(?:_\d{2}){5}_\d{3}_[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\.png$/,
    );
    const data = Buffer.from(result.data);
    expect(readFileSync(result.path)).toEqual(data);
    await expectImage(data, "png");
  }
  expect(readdirSync(resolve(workspace.dir, "mdimg_output"))).toHaveLength(2);
  expect(readdirSync(workspace.dir).sort()).toEqual([
    "input.md",
    "mdimg_output",
  ]);
});
