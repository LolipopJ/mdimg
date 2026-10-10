/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const repository = path.resolve(__dirname, "..");
const assets = path.join(repository, "lib", "assets");
const manifest = JSON.parse(
  readFileSync(path.join(assets, "manifest.json"), "utf8"),
);
const paths = manifest.files.map((file) => file.path);
const themeNames = paths
  .filter(
    (filename) =>
      filename.startsWith("highlight/styles/") &&
      filename.endsWith(".css") &&
      !filename.endsWith(".min.css"),
  )
  .map((filename) => filename.slice("highlight/styles/".length, -".css".length))
  .sort();
let buildAssets;
let mathJax;
let cssFiles;
let packed;

beforeAll(async () => {
  buildAssets = await importPackage(
    path.join(repository, "script/build-assets.mjs"),
  );
  mathJax = buildAssets.mathJaxInputs();
  cssFiles = buildAssets
    .listFiles(path.join(repository, "template", "css"))
    .filter((filename) => filename.endsWith(".css"));
  const args = ["pack", "--dry-run", "--ignore-scripts", "--json"];
  const windows = process.platform === "win32";
  const [pack] = JSON.parse(
    execFileSync(
      windows ? process.env.ComSpec : "npm",
      windows ? ["/d", "/s", "/c", `npm ${args.join(" ")}`] : args,
      {
        cwd: repository,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 30000,
        windowsHide: true,
      },
    ),
  );
  packed = new Set(pack.files.map((file) => file.path));
}, 30000);

describe("RESOURCES: offline asset manifest", () => {
  test("uses the supported schema and resource lists", () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(Array.isArray(manifest.files)).toBe(true);
    expect(Array.isArray(manifest.packages)).toBe(true);
  });

  test("lists every generated asset exactly once in sorted order", () => {
    expect(paths).toEqual([...new Set(paths)].sort());
    expect(paths).toEqual(
      buildAssets
        .listFiles(assets)
        .map((filename) => buildAssets.resourcePath(assets, filename))
        .filter((filename) => filename !== "manifest.json"),
    );
  });

  test.each(manifest.files.map((file) => [file.path, file]))(
    "validates path, size, hash, offline CSS and package inclusion: %s",
    (_name, file) => {
      expect(typeof file.path).toBe("string");
      expect(file.path).not.toContain("\\");
      expect(file.path.split("/")).not.toContain("..");
      expect(path.isAbsolute(file.path)).toBe(false);
      expect(file.path).not.toContain(":");
      const data = readFileSync(path.join(assets, file.path));
      expect(data.length).toBe(file.size);
      expect(buildAssets.sha256(data)).toBe(file.sha256);
      if (file.path.endsWith(".css"))
        expect(() =>
          buildAssets.assertOfflineCss(data.toString(), file.path),
        ).not.toThrow();
      expect(packed.has(`lib/assets/${file.path}`)).toBe(true);
    },
  );

  test.each(["highlight.js", "mermaid.js"])(
    "contains a standalone browser script: %s",
    (filename) => {
      expect(() =>
        buildAssets.assertStandaloneScript(
          readFileSync(path.join(assets, filename), "utf8"),
          filename,
        ),
      ).not.toThrow();
    },
  );

  test("includes every required adapter, component and notice", () => {
    expect(paths).toEqual(
      expect.arrayContaining([
        "mathjax-adapter.js",
        "page-ready.js",
        "mermaid-adapter.js",
        "mermaid-layouts.json",
        "katex.css",
        ...buildAssets.requiredMathJaxFiles,
        "THIRD-PARTY-NOTICES.txt",
      ]),
    );
    expect(
      paths.some(
        (filename) =>
          filename.startsWith("mathjax-newcm/svg/dynamic/") &&
          filename.endsWith(".js"),
      ),
    ).toBe(true);
  });
});

describe("RESOURCES: installed package inputs", () => {
  test("records every resource package", () => {
    expect(manifest.packages.map(({ name }) => name)).toEqual(
      buildAssets.resourcePackages,
    );
  });

  test.each(manifest.packages.map((entry) => [entry.name, entry]))(
    "matches version, license and notice: %s",
    (_name, entry) => {
      const { metadata } = buildAssets.resolvePackage(entry.name);
      expect(entry.version).toBe(metadata.version);
      expect(entry.license).toBe(metadata.license);
      expect(
        readFileSync(path.join(assets, "THIRD-PARTY-NOTICES.txt"), "utf8"),
      ).toContain(`${entry.name}@${entry.version} (${entry.license})`);
    },
  );

  test("includes the full MathJax component and SVG glyph closure", () => {
    expect(
      paths.filter((filename) => /^(?:mathjax|mathjax-newcm)\//.test(filename)),
    ).toEqual(mathJax.map(({ output }) => output).sort());
  });

  test.each(
    paths.filter((filename) => /^(?:mathjax|mathjax-newcm)\//.test(filename)),
  )("copies the installed MathJax input unchanged: %s", (output) => {
    const input = mathJax.find((entry) => entry.output === output);
    expect(input).toBeDefined();
    expect(buildAssets.sha256(readFileSync(path.join(assets, output)))).toBe(
      buildAssets.sha256(readFileSync(input.filename)),
    );
  });

  test("includes every highlight theme", () => {
    const styles = path.join(
      buildAssets.resolvePackage("highlight.js").directory,
      "styles",
    );
    expect(
      paths.filter((filename) => filename.startsWith("highlight/styles/")),
    ).toEqual(
      buildAssets
        .listFiles(styles)
        .filter(
          (filename) =>
            filename.endsWith(".css") && !filename.endsWith(".min.css"),
        )
        .map(
          (filename) =>
            `highlight/styles/${buildAssets.resourcePath(styles, filename)}`,
        )
        .sort(),
    );
  });

  test.each(["src/interfaces/index.ts", "lib/interfaces/index.d.ts"])(
    "declares precisely the bundled public themes: %s",
    (filename) => {
      const source = ts.createSourceFile(
        filename,
        readFileSync(path.join(repository, filename), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const alias = source.statements.find(
        (statement) =>
          ts.isTypeAliasDeclaration(statement) &&
          statement.name.text === "IHighlightJsTheme",
      );
      expect(alias).toBeDefined();
      expect(ts.isUnionTypeNode(alias.type)).toBe(true);
      const names = alias.type.types
        .map((type) => {
          expect(ts.isLiteralTypeNode(type)).toBe(true);
          expect(ts.isStringLiteral(type.literal)).toBe(true);
          return type.literal.text;
        })
        .sort();
      expect(names).toEqual(themeNames);
    },
  );
});

describe("RESOURCES: npm package contents", () => {
  test("publishes the manifest and every compiled offline template", () => {
    expect(packed.has("lib/assets/manifest.json")).toBe(true);
    expect(cssFiles.length).toBeGreaterThan(0);
    for (const filename of cssFiles) {
      expect(() =>
        buildAssets.assertOfflineCss(readFileSync(filename, "utf8"), filename),
      ).not.toThrow();
      expect(packed.has(buildAssets.resourcePath(repository, filename))).toBe(
        true,
      );
    }
  });

  test("publishes every public entry point", () => {
    const metadata = require("../package.json");
    const targets = [
      metadata.main,
      metadata.module,
      metadata.types,
      ...Object.values(metadata.bin),
    ];
    const collectExports = (value) => {
      if (typeof value === "string") targets.push(value);
      else if (value && typeof value === "object")
        Object.values(value).forEach(collectExports);
    };
    collectExports(metadata.exports);
    for (const target of targets) {
      expect(typeof target).toBe("string");
      const filename = target.replace(/^\.\//, "");
      expect(packed.has(filename)).toBe(true);
      expect(() => readFileSync(path.join(repository, filename))).not.toThrow();
    }
  });

  test("publishes every declaration file", () => {
    for (const filename of buildAssets
      .listFiles(path.join(repository, "lib"))
      .filter((filename) => /\.d\.(?:ts|mts)$/.test(filename))) {
      expect(packed.has(buildAssets.resourcePath(repository, filename))).toBe(
        true,
      );
    }
  });

  test("omits obsolete static resources", () => {
    expect([...packed].some((filename) => filename.startsWith("static/"))).toBe(
      false,
    );
  });
});
