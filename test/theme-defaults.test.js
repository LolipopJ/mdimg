const { resolve } = require("node:path");
const { readFileSync } = require("node:fs");
const { mdimg, createHtmlOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");

test.each([
  ["github", "atom-one-light", "default"],
  ["githubDark", "atom-one-dark", "dark"],
  [resolve(__dirname, "../template/css/midnight.css"), "atom-one-dark", "dark"],
])(
  "THEMES: %s selects matching extension defaults",
  async (cssTemplate, highlight, mermaid) => {
    const { html } = await mdimg({
      inputText: "```js\nconst x = 1;\n```",
      cssTemplate,
      extensions: { mathJax: false },
      outputProcessor: createHtmlOutputProcessor(),
    });
    expect(
      html.includes(
        readFileSync(
          resolve(__dirname, `../lib/assets/highlight/styles/${highlight}.css`),
          "utf8",
        ),
      ),
    ).toBe(true);
    expect(
      JSON.parse(html.match(/\n\s*mermaid.initialize\((.+)\);/)[1]),
    ).toEqual({ theme: mermaid, startOnLoad: false });
  },
);

test("THEMES: explicit extension themes override template defaults", async () => {
  const { html } = await mdimg({
    inputText: "# Custom",
    cssTemplate: "githubDark",
    extensions: {
      highlightJs: { theme: "github" },
      mathJax: false,
      mermaid: { theme: "forest" },
    },
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(
    html.includes(
      readFileSync(
        resolve(__dirname, "../lib/assets/highlight/styles/github.css"),
        "utf8",
      ),
    ),
  ).toBe(true);
  expect(JSON.parse(html.match(/\n\s*mermaid.initialize\((.+)\);/)[1])).toEqual(
    { theme: "forest", startOnLoad: false },
  );
});
