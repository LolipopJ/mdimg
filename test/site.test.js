const { readFileSync, mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const ts = requirePackage(__filename)("typescript");

const workspace = mkdtempSync(join(tmpdir(), "mdimg-site-"));
afterAll(() => rmSync(workspace, { recursive: true, force: true }));

async function loadSource(name) {
  const source = resolve(
    __dirname,
    name === "themeDefaults"
      ? "../src/utils/themeDefaults.ts"
      : `../site/src/${name}.ts`,
  );
  if (name === "config") await loadSource("themeDefaults");
  if (!require("node:fs").existsSync(source)) return {};
  const filename = join(workspace, `${name}.mjs`);
  writeFileSync(
    filename,
    ts
      .transpileModule(readFileSync(source, "utf8"), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      })
      .outputText.replace(
        "../../src/utils/themeDefaults",
        "./themeDefaults.mjs",
      ),
  );
  return importPackage(filename);
}

test("SITE: only valid safe integer inputs replace the last valid values", async () => {
  const { integerError } = await loadSource("config");
  expect(typeof integerError).toBe("function");
  for (const value of [
    "",
    " ",
    "0",
    "-1",
    "1.5",
    "Infinity",
    "9007199254740992",
  ]) {
    expect(integerError(value, 1)).not.toBeNull();
  }
  expect(integerError("800", 1)).toBeNull();
  expect(integerError("0", 0, 100)).toBeNull();
  expect(integerError("100", 0, 100)).toBeNull();
  expect(integerError("101", 0, 100)).not.toBeNull();
});

test("SITE: calls preserve false extensions, words HTML and format", async () => {
  const { createCalls } = await loadSource("commands");
  expect(typeof createCalls).toBe("function");
  const config = {
    cssTemplate: "words",
    width: 800,
    type: "webp",
    quality: 0,
    highlightJs: false,
    highlightTheme: "github",
    mathJax: false,
    mermaid: false,
    mermaidTheme: "default",
  };
  const calls = createCalls(config, "words", "posix");
  expect(calls.options).toMatchObject({
    htmlTemplate: "words",
    cssTemplate: "words",
    type: "webp",
    quality: 0,
    outputFilename: "path/to/image.webp",
    extensions: { highlightJs: false, mathJax: false, mermaid: false },
  });
  expect(calls.cli).toContain("--css");
  expect(calls.cli).not.toContain("--cssTemplate");
  expect(calls.cli).not.toContain("--theme");
  expect(calls.options).not.toHaveProperty("theme");
  expect(calls.node).toContain('import { mdimg } from "mdimg"');
  const png = createCalls(
    { ...config, type: "png", highlightJs: true, mathJax: true },
    "default",
    "posix",
  );
  expect(png.options).not.toHaveProperty("quality");
  expect(png.options.extensions.highlightJs).toEqual({ theme: "github" });
  expect(png.options.extensions.mathJax.tex.inlineMath).toEqual([
    ["$", "$"],
    ["\\(", "\\)"],
  ]);
  expect(png.cli).not.toContain("--quality");
});

test("SITE: switching templates resets extension themes together", async () => {
  const { defaults, selectTemplate } = await loadSource("config");
  expect(typeof selectTemplate).toBe("function");
  const custom = {
    ...defaults,
    width: 1200,
    highlightTheme: "base16/dracula",
    mermaidTheme: "forest",
    highlightJs: false,
  };
  for (const cssTemplate of [
    "binance",
    "bmw-m",
    "claude",
    "githubDark",
    "midnight",
    "playstation",
    "replicate",
    "sentry",
    "spacex",
    "vercel",
    "x.ai",
  ]) {
    const dark = selectTemplate(custom, cssTemplate);
    expect(dark).toMatchObject({
      cssTemplate,
      width: 1200,
      highlightJs: false,
      highlightTheme: "atom-one-dark",
      mermaidTheme: "dark",
    });
    expect(selectTemplate(dark, "github")).toMatchObject({
      cssTemplate: "github",
      highlightTheme: "atom-one-light",
      mermaidTheme: "default",
    });
  }
  expect(custom.mermaidTheme).toBe("forest");
});

test("SITE: shell quoting preserves apostrophes, dollar signs and extension JSON", async () => {
  const { createCalls, quoteShell } = await loadSource("commands");
  expect(typeof quoteShell).toBe("function");
  expect(quoteShell("a'b$`\\", "posix")).toBe("'a'\\''b$`\\'");
  expect(quoteShell("a'b$`\\", "powershell")).toBe("'a''b$`\\'");
  const calls = createCalls(
    {
      cssTemplate: "default",
      width: 1,
      type: "jpeg",
      quality: 100,
      highlightJs: true,
      highlightTheme: "github-dark",
      mathJax: true,
      mermaid: true,
      mermaidTheme: "forest",
    },
    "default",
    "powershell",
  );
  expect(calls.options.extensions.highlightJs).toEqual({
    theme: "github-dark",
  });
  expect(calls.options.extensions.mermaid).toEqual({ theme: "forest" });
  expect(calls.cli).toContain("--quality 100");
  expect(calls.cli).toContain(JSON.stringify(calls.options.extensions));
});

test("SITE: manifest is derived from committed templates and exact lockfile versions", async () => {
  const filename = resolve(__dirname, "../site/manifest.mjs");
  const { createManifest } = require("node:fs").existsSync(filename)
    ? await importPackage(filename)
    : {};
  expect(typeof createManifest).toBe("function");
  const manifest = createManifest();
  const { execFileSync } = require("node:child_process");
  const files = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", manifest.commit, "--", "template/css"],
    { cwd: resolve(__dirname, ".."), encoding: "utf8" },
  )
    .trim()
    .split(/\r?\n/)
    .filter((name) => name.endsWith(".css"));
  expect(manifest.templates.map((t) => t.name).sort()).toEqual(
    files.map((name) => name.slice("template/css/".length, -4)).sort(),
  );
  expect(manifest.templates.find((t) => t.name === "words").html).toBe("words");
  expect(manifest.templates.find((t) => t.name === "github").html).toBe(
    "default",
  );
  expect(manifest.highlightThemes).toContain("base16/dracula");
  expect(manifest.highlightThemes).not.toContain("auto");
  expect(manifest.mermaidThemes).toEqual([
    "base",
    "dark",
    "default",
    "forest",
    "neutral",
    "neo",
    "neo-dark",
    "redux",
    "redux-dark",
    "redux-color",
    "redux-dark-color",
  ]);
  expect(manifest.assetBase).toBe(
    `https://cdn.jsdelivr.net/gh/LolipopJ/mdimg@${manifest.commit}/`,
  );
  for (const version of Object.values(manifest.versions))
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("SITE: Markdown and diagram themes change preview identity; export options do not", async () => {
  const { defaults, renderKey, documentFilename } = await loadSource("config");
  expect(documentFilename("words")).toBe("test-template-words.md");
  expect(documentFilename("github")).toBe("test.md");
  expect(renderKey(defaults, "# First")).not.toBe(
    renderKey(defaults, "# Last"),
  );
  expect(renderKey(defaults, "# First")).toBe(
    renderKey({ ...defaults, type: "webp", quality: 0 }, "# First"),
  );
  expect(renderKey(defaults, "# First")).not.toBe(
    renderKey({ ...defaults, mermaidTheme: "forest" }, "# First"),
  );
});

test("SITE: development JSX uses the same pinned React instance as React DOM", async () => {
  const { createManifest, importMap } = await importPackage(
    resolve(__dirname, "../site/manifest.mjs"),
  );
  const manifest = createManifest();
  const development = importMap(manifest, true).imports;
  expect(development.react).toBe(
    `https://esm.sh/react@${manifest.versions.react}?dev`,
  );
  expect(development["react/jsx-dev-runtime"]).toContain("external=react&dev");
  expect(development["react-dom/client"]).toContain("external=react&dev");
  expect(importMap(manifest).imports.react).not.toContain("?dev");
});

test("SITE: sample documents and relative images resolve to GitHub remote resources", async () => {
  const { resourceUrl } = await loadSource("resources");
  expect(typeof resourceUrl).toBe("function");
  const base =
    "https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/";
  expect(resourceUrl("test.md")).toBe(`${base}test.md`);
  expect(resourceUrl("test-template-words.md")).toBe(
    `${base}test-template-words.md`,
  );
  expect(resourceUrl("./marked-logo-black.svg")).toBe(
    `${base}marked-logo-black.svg`,
  );
  expect(resourceUrl("https://example.com/image.png")).toBe(
    "https://example.com/image.png",
  );
  expect(() => resourceUrl("file:///C:/images/local.png")).toThrow("remote");
  expect(() => resourceUrl("C:\\images\\local.png")).toThrow("remote");
});
