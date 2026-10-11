const { load } = require("cheerio");
const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { mdimg, createImageOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const { expectMarkdown, useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const expectImage = useImageAssertions();

test.each([
  {
    name: "default",
    htmlTemplate: "default",
    cssTemplate: "default",
    theme: "light",
    width: 800,
    styles: { paddingTop: "96px", paddingLeft: "64px" },
  },
  {
    name: "empty",
    htmlTemplate: "default",
    cssTemplate: "empty",
    theme: "light",
    width: 800,
    styles: { paddingTop: "0px", paddingLeft: "0px" },
  },
  {
    name: "github",
    htmlTemplate: "default",
    cssTemplate: "github",
    theme: "light",
    width: 1000,
    styles: {
      paddingTop: "96px",
      paddingLeft: "64px",
      backgroundColor: "rgb(255, 255, 255)",
      color: "rgb(31, 35, 40)",
    },
  },
  {
    name: "githubDark",
    htmlTemplate: "default",
    cssTemplate: "githubDark",
    theme: "dark",
    width: 1000,
    styles: {
      paddingTop: "96px",
      paddingLeft: "64px",
      backgroundColor: "rgb(13, 17, 23)",
      color: "rgb(240, 246, 252)",
    },
  },
  {
    name: "words",
    htmlTemplate: "words",
    cssTemplate: "words",
    theme: "light",
    width: 1200,
    styles: {
      paddingTop: "32px",
      paddingLeft: "64px",
      backgroundColor: "rgb(250, 250, 250)",
    },
  },
])(
  "TEMPLATE: $name preview has its DOM, styles and image width",
  async ({ name, htmlTemplate, cssTemplate, theme, width, styles }) => {
    const marker = `Preview-${name}`;
    writeFileSync(workspace.inputFilename, marker);
    const outputFilename = resolve(workspace.dir, `${name}.png`);
    const processor = createImageOutputProcessor("png", undefined, "binary");
    const result = await mdimg({
      inputFilename: workspace.inputFilename,
      outputFilename,
      extensions: false,
      htmlTemplate,
      cssTemplate,
      theme,
      width,
      outputProcessor: {
        ...processor,
        async process(context) {
          const rendered = await context.page.evaluate(() => {
            const body = document.querySelector("#mdimg-body");
            const content = body.querySelector(".markdown-body");
            const style = getComputedStyle(content);
            const border = getComputedStyle(body);
            return {
              text: content.textContent.trim(),
              styles: {
                paddingTop: style.paddingTop,
                paddingLeft: style.paddingLeft,
                backgroundColor: style.backgroundColor,
                color: style.color,
              },
              quote: body.querySelector(".top")?.textContent,
              bottom: body.querySelectorAll(".bottom").length,
              borderWidth: border.borderLeftWidth,
              borderColor: border.borderLeftColor,
            };
          });
          expect(rendered.text).toBe(marker);
          expect(rendered.styles).toMatchObject(styles);
          if (name === "words") {
            expect(rendered.quote).toBe("“");
            expect(rendered.bottom).toBe(1);
            expect(rendered.borderWidth).toBe("48px");
            expect(rendered.borderColor).toBe("rgb(29, 155, 240)");
          } else {
            expect(rendered.quote).toBeUndefined();
            expect(rendered.bottom).toBe(0);
          }
          return processor.process(context);
        },
      },
    });
    expect(result.path).toBe(outputFilename);
    expect(readFileSync(outputFilename)).toEqual(Buffer.from(result.data));
    await expectImage(result.data, "png", { width });
  },
);

test("TEMPLATE: local files replace old content and crop to mdimg-body", async () => {
  const htmlTemplate = resolve(workspace.dir, "local & 'quoted'.html");
  const cssTemplate = resolve(workspace.dir, "local & 'quoted'.css");
  const outputFilename = resolve(workspace.dir, "local.png");
  writeFileSync(
    htmlTemplate,
    '<aside id="outside">Outside-local-marker</aside><section id="mdimg-body"><article class="markdown-body"><p>Obsolete-local-marker</p></article></section>',
  );
  writeFileSync(
    cssTemplate,
    "body { margin: 0; background: red; } #outside { width: 900px; height: 360px; background: blue; } #mdimg-body { width: 240px; height: 180px; background: rgb(10, 20, 30); color: white; } h1 { margin: 0; }",
  );
  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    outputFilename,
    extensions: false,
    width: 320,
    htmlTemplate,
    cssTemplate,
  });
  const $ = load(result.html);
  expect($("#mdimg-body > article.markdown-body")).toHaveLength(1);
  expectMarkdown(result.html);
  expect($("#outside").text()).toBe("Outside-local-marker");
  expect($(".markdown-body").text()).not.toContain("Obsolete-local-marker");
  expect(result.path).toBe(outputFilename);
  expect(readFileSync(outputFilename)).toEqual(Buffer.from(result.data));
  await expectImage(result.data, "png", {
    width: 240,
    height: 180,
    pixel: [10, 20, 30, 255],
  });
});

test("TEMPLATE: HTML and CSS text override conflicting local files", async () => {
  const htmlTemplate = resolve(workspace.dir, "ignored.html");
  const cssTemplate = resolve(workspace.dir, "ignored.css");
  const outputFilename = resolve(workspace.dir, "text.png");
  writeFileSync(
    htmlTemplate,
    '<div id="mdimg-body"><div class="markdown-body"></div><p>Ignored-HTML-marker</p></div>',
  );
  writeFileSync(
    cssTemplate,
    "/* Ignored-CSS-marker */ #mdimg-body { height: 450px; background: red; }",
  );
  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    outputFilename,
    extensions: false,
    width: 320,
    htmlTemplate,
    cssTemplate,
    htmlText:
      '<div id="mdimg-body"><article class="markdown-body"><p>Obsolete-text-marker</p></article></div>',
    cssText:
      "/* Used-CSS-text-marker */ body { margin: 0; } #mdimg-body { height: 200px; background: rgb(10, 20, 30); color: white; } h1 { margin: 0; }",
  });
  const $ = load(result.html);
  expect($("#mdimg-body > article.markdown-body")).toHaveLength(1);
  expectMarkdown(result.html);
  expect(result.html).not.toContain("Ignored-HTML-marker");
  expect($("style").text()).not.toContain("Ignored-CSS-marker");
  expect($("style").text()).toContain("Used-CSS-text-marker");
  expect($(".markdown-body").text()).not.toContain("Obsolete-text-marker");
  expect(result.path).toBe(outputFilename);
  expect(readFileSync(outputFilename)).toEqual(Buffer.from(result.data));
  await expectImage(result.data, "png", {
    width: 320,
    height: 200,
    pixel: [10, 20, 30, 255],
  });
});
