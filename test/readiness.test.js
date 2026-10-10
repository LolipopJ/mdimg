/* eslint-disable no-undef */

const {
  mdimg,
  createHtmlOutputProcessor,
  createImageOutputProcessor,
  createPdfOutputProcessor,
} = requirePackage(__filename)("../lib/mdimg.js");

test("READINESS: exported HTML owns one readiness promise with disabled extensions", async () => {
  const { html } = await mdimg({
    inputText: "# Offline",
    extensions: false,
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(html).toContain("__mdimgReady");
  expect(html).toContain("__mdimgTasks");
  expect(html).not.toContain('name: "mathJax"');
});

test("READINESS: extension configuration cannot terminate its script element", async () => {
  const { html } = await mdimg({
    inputText: "```js\nconst a = 1;\n```",
    extensions: {
      highlightJs: {
        classPrefix: "</script><script>globalThis.injected=true</script>",
      },
      mathJax: false,
      mermaid: false,
    },
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(html).not.toContain("<script>globalThis.injected=true</script>");
  expect(html).toContain("\\u003c/script\\u003e");
});

test("READINESS: unknown theme fails clearly before rendering", async () => {
  await expect(
    mdimg({
      inputText: "# Offline",
      extensions: {
        highlightJs: { theme: "../missing-theme" },
        mathJax: false,
        mermaid: false,
      },
      outputProcessor: createHtmlOutputProcessor(),
    }),
  ).rejects.toThrow(/highlightJs.*unknown theme/i);
});

test("READINESS: a missing bootstrap cannot produce an image", async () => {
  await expect(
    mdimg({
      inputText: "# Missing readiness",
      extensions: false,
      encoding: "blob",
      plugins: [
        {
          name: "remove-bootstrap",
          hooks: {
            afterSplice: (html) =>
              html.replace(/<script>[\s\S]*?<\/script>/, ""),
          },
        },
      ],
    }),
  ).rejects.toThrow(/missing page readiness Promise/i);
});

test.each([
  ["PNG", createImageOutputProcessor("png", undefined, "binary")],
  ["PDF", createPdfOutputProcessor()],
])(
  "READINESS: invalid MathML cannot produce %s",
  async (_format, outputProcessor) => {
    await expect(
      mdimg({
        inputText: "<math><mfrac><mi>x</mi></mfrac></math>",
        extensions: { highlightJs: false, mermaid: false },
        outputProcessor,
      }).then(() => undefined),
    ).rejects.toThrow(/MathJax.*MathML.*Wrong number of children.*mfrac/i);
  },
);
