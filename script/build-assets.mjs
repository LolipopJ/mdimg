import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { rollup } from "rollup";
import { parseAst } from "rollup/parseAst";

export const repository = path.resolve(import.meta.dirname, "..");
const require = createRequire(path.join(repository, "package.json"));
const assets = path.join(repository, "lib", "assets");
export const resourcePackages = [
  "@mathjax/mathjax-newcm-font",
  "github-markdown-css",
  "highlight.js",
  "katex",
  "mathjax",
  "mermaid",
  "normalize.css",
];
export const requiredMathJaxFiles = [
  "mathjax/startup.js",
  "mathjax/core.js",
  "mathjax/input/tex.js",
  "mathjax/input/mml.js",
  "mathjax/output/svg.js",
  "mathjax-newcm/svg.js",
];
const mimeTypes = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

export function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(filename);
      if (entry.isFile()) return [filename];
      throw new Error(`Unsupported resource entry: ${filename}`);
    })
    .sort();
}

export function resourcePath(directory, filename) {
  return path.relative(directory, filename).split(path.sep).join("/");
}

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function resolvePackage(name) {
  const filename = require.resolve(`${name}/package.json`);
  const metadata = JSON.parse(readFileSync(filename, "utf8"));
  if (metadata.name !== name || !metadata.version || !metadata.license) {
    throw new Error(`Package metadata is incomplete: ${name}`);
  }
  return { directory: path.dirname(filename), filename, metadata };
}

export function mathJaxInputs() {
  const inputs = [
    ["mathjax", "mathjax"],
    ["@mathjax/mathjax-newcm-font", "mathjax-newcm"],
  ].flatMap(([name, output]) => {
    const { directory } = resolvePackage(name);
    return listFiles(directory).flatMap((filename) => {
      const relative = resourcePath(directory, filename);
      if (
        !relative.endsWith(".js") ||
        (name === "mathjax" &&
          !(
            relative === "startup.js" ||
            relative === "core.js" ||
            relative.startsWith("input/") ||
            relative === "output/svg.js" ||
            relative.startsWith("output/svg/") ||
            relative.startsWith("ui/") ||
            (relative.startsWith("a11y/") && relative !== "a11y/sre.js")
          )) ||
        (name !== "mathjax" &&
          relative !== "svg.js" &&
          !relative.startsWith("svg/"))
      ) {
        return [];
      }
      return [{ filename, output: `${output}/${relative}` }];
    });
  });
  const font = inputs.find(({ output }) => output === "mathjax-newcm/svg.js");
  if (!font) throw new Error("MathJax SVG font entry is missing");
  const definitions = [
    ...scriptNodes(readFileSync(font.filename, "utf8")),
  ].filter(
    (node) =>
      node.type === "CallExpression" &&
      node.callee.type === "MemberExpression" &&
      node.callee.property.name === "defineDynamicFiles",
  );
  if (
    definitions.length !== 1 ||
    definitions[0].arguments[0]?.type !== "ArrayExpression"
  ) {
    throw new Error("Unsupported MathJax SVG dynamic font table");
  }
  for (const definition of definitions[0].arguments[0].elements) {
    const name = definition?.elements?.[0]?.value;
    if (typeof name !== "string" || !/^[a-z\d-]+$/i.test(name)) {
      throw new Error("Unsupported MathJax SVG dynamic font resource name");
    }
    const required = `mathjax-newcm/svg/dynamic/${name}.js`;
    if (!inputs.some(({ output }) => output === required)) {
      throw new Error(
        `Required MathJax dynamic glyph input is missing: ${required}`,
      );
    }
  }
  return inputs;
}

function cssUrls(css, filename) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  if (/@import\b/i.test(source)) {
    throw new Error(
      `CSS imports must be compiled into the resource: ${filename}`,
    );
  }
  const urls = [
    ...source.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi),
  ];
  if (urls.length !== [...source.matchAll(/\burl\s*\(/gi)].length) {
    throw new Error(`Unresolved CSS URL syntax: ${filename}`);
  }
  return urls.map((match) => (match[1] ?? match[2] ?? match[3]).trim());
}

export function assertOfflineCss(css, filename) {
  for (const url of cssUrls(css, filename)) {
    if (!/^(?:data:|#)/i.test(url)) {
      throw new Error(`CSS resource is not embedded: ${filename}: ${url}`);
    }
  }
}

function inlineCss(filename, packageDirectory) {
  const css = readFileSync(filename, "utf8");
  cssUrls(css, filename);
  const embedded = css.replace(
    /\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
    (match, doubleQuoted, singleQuoted, unquoted) => {
      const url = (doubleQuoted ?? singleQuoted ?? unquoted).trim();
      if (/^(?:data:|#)/i.test(url)) return match;
      if (/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(url)) {
        throw new Error(`External CSS resource: ${filename}: ${url}`);
      }
      const image = fileURLToPath(new URL(url, pathToFileURL(filename)));
      const relative = path.relative(packageDirectory, image);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(
          `CSS resource leaves its npm package: ${filename}: ${url}`,
        );
      }
      const mime = mimeTypes[path.extname(image).toLowerCase()];
      if (!mime || !statSync(image).isFile()) {
        throw new Error(`Unsupported CSS resource: ${filename}: ${url}`);
      }
      return `url("data:${mime};base64,${readFileSync(image).toString("base64")}")`;
    },
  );
  assertOfflineCss(embedded, filename);
  return embedded;
}

function* scriptNodes(script) {
  const pending = [parseAst(script)];
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== "object") continue;
    yield node;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) pending.push(...value);
      else if (value && typeof value === "object") pending.push(value);
    }
  }
}

function mermaidLayouts(directory) {
  const entries = listFiles(path.join(directory, "dist/chunks/mermaid.core"))
    .filter((filename) => filename.endsWith(".mjs"))
    .map((filename) => readFileSync(filename, "utf8"))
    .filter((source) => source.includes("var registerDefaultLayoutLoaders ="));
  if (entries.length !== 1)
    throw new Error("Unsupported Mermaid layout registry");
  const layouts = new Set();
  for (const node of scriptNodes(entries[0])) {
    if (node.type === "ObjectExpression") {
      const name = node.properties.find(
        (property) => property.key?.name === "name",
      );
      if (
        node.properties.some((property) => property.key?.name === "loader") &&
        typeof name?.value?.value === "string"
      ) {
        layouts.add(name.value.value);
      }
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.name === "ELK_ALGORITHMS" &&
      node.init.type === "ArrayExpression"
    ) {
      for (const item of node.init.elements) {
        if (typeof item.value !== "string")
          throw new Error("Unsupported Mermaid ELK layout name");
        layouts.add(item.value);
      }
    }
  }
  if (!layouts.has("dagre") || !layouts.has("elk"))
    throw new Error("Incomplete Mermaid layout registry");
  return [...layouts].sort();
}

export function assertStandaloneScript(script, filename) {
  for (const node of scriptNodes(script)) {
    if (
      node.type === "ImportExpression" ||
      node.type === "ImportDeclaration" ||
      (node.source &&
        (node.type === "ExportNamedDeclaration" ||
          node.type === "ExportAllDeclaration"))
    ) {
      throw new Error(
        `Browser script requires an external module: ${filename}`,
      );
    }
  }
}

function removeGenerated(directory) {
  const resolved = path.resolve(directory);
  if (
    path.dirname(resolved) !== path.join(repository, "lib") ||
    path.basename(resolved) !== "assets"
  ) {
    throw new Error(
      `Refusing to remove an unexpected resource path: ${resolved}`,
    );
  }
  rmSync(resolved, { recursive: true, force: true });
}

export async function buildAssets() {
  removeGenerated(assets);
  mkdirSync(assets, { recursive: true });
  try {
    const packages = resourcePackages.map(resolvePackage);
    const findPackage = (name) =>
      packages.find(({ metadata }) => metadata.name === name);
    const writeAsset = (filename, data) => {
      const target = path.join(assets, filename);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, data, { flag: "wx" });
    };

    const highlight = await rollup({
      input: path.join(repository, "src", "browser", "highlight.js"),
      plugins: [nodeResolve({ browser: true }), commonjs(), terser()],
      onwarn(warning, warn) {
        if (warning.code === "UNRESOLVED_IMPORT")
          throw new Error(warning.message);
        warn(warning);
      },
    });
    try {
      await highlight.write({
        file: path.join(assets, "highlight.js"),
        format: "iife",
      });
    } finally {
      await highlight.close();
    }
    assertStandaloneScript(
      readFileSync(path.join(assets, "highlight.js"), "utf8"),
      "highlight.js",
    );

    const highlightPackage = findPackage("highlight.js");
    const styles = path.join(highlightPackage.directory, "styles");
    const themes = listFiles(styles).filter(
      (filename) => filename.endsWith(".css") && !filename.endsWith(".min.css"),
    );
    if (!themes.length) throw new Error("highlight.js has no theme CSS files");
    for (const filename of themes) {
      writeAsset(
        `highlight/styles/${resourcePath(styles, filename)}`,
        inlineCss(filename, highlightPackage.directory),
      );
    }

    const mermaidPackage = findPackage("mermaid");
    const mermaid = readFileSync(
      require.resolve("mermaid/dist/mermaid.min.js"),
      "utf8",
    );
    assertStandaloneScript(mermaid, "mermaid.js");
    writeAsset("mermaid.js", mermaid);
    writeAsset(
      "mermaid-layouts.json",
      JSON.stringify(mermaidLayouts(mermaidPackage.directory)),
    );

    const katexPackage = findPackage("katex");
    const bundledKatex = JSON.parse(
      readFileSync(
        createRequire(mermaidPackage.filename).resolve("katex/package.json"),
        "utf8",
      ),
    );
    if (bundledKatex.version !== katexPackage.metadata.version) {
      throw new Error("Mermaid and embedded KaTeX CSS versions do not match");
    }
    writeAsset(
      "katex.css",
      inlineCss(
        require.resolve("katex/dist/katex.min.css"),
        katexPackage.directory,
      ),
    );

    const mathJax = mathJaxInputs();
    for (const required of requiredMathJaxFiles) {
      if (!mathJax.some(({ output }) => output === required)) {
        throw new Error(`Required MathJax input is missing: ${required}`);
      }
    }
    for (const { filename, output } of mathJax) {
      writeAsset(output, readFileSync(filename));
    }
    for (const name of ["mathjax", "mermaid", "page-ready"]) {
      const script = readFileSync(
        path.join(repository, "src", "browser", `${name}.js`),
        "utf8",
      );
      parseAst(script);
      writeAsset(
        name === "page-ready" ? "page-ready.js" : `${name}-adapter.js`,
        script,
      );
    }

    const notices = packages.map(({ directory, metadata }) => {
      let licenseSource = `${metadata.name} npm package`;
      if (metadata.name === "@mathjax/mathjax-newcm-font") {
        const mathjax = findPackage("mathjax");
        if (
          metadata.license !== "Apache-2.0" ||
          metadata.license !== mathjax.metadata.license
        ) {
          throw new Error("MathJax font and shared license text differ");
        }
        // The font package declares Apache-2.0 but ships no license text.
        directory = mathjax.directory;
        licenseSource = "mathjax npm package (shared Apache-2.0 license text)";
      }
      const licenses = readdirSync(directory)
        .filter((filename) =>
          /^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i.test(filename),
        )
        .sort();
      if (!licenses.length)
        throw new Error(`Missing license text: ${metadata.name}`);
      return [
        `${metadata.name}@${metadata.version} (${metadata.license})`,
        `License text source: ${licenseSource}`,
        ...licenses.map(
          (filename) =>
            `${filename}\n${readFileSync(path.join(directory, filename), "utf8").trim()}`,
        ),
      ].join("\n\n");
    });
    writeAsset(
      "THIRD-PARTY-NOTICES.txt",
      `${notices.join(`\n\n${"=".repeat(72)}\n\n`)}\n`,
    );
    const files = listFiles(assets).map((filename) => {
      const data = readFileSync(filename);
      return {
        path: resourcePath(assets, filename),
        size: data.length,
        sha256: sha256(data),
      };
    });
    writeAsset(
      "manifest.json",
      `${JSON.stringify(
        {
          schemaVersion: 1,
          packages: packages.map(({ metadata }) => ({
            name: metadata.name,
            version: metadata.version,
            license: metadata.license,
          })),
          files,
        },
        null,
        2,
      )}\n`,
    );
    console.log(
      `Built ${files.length} offline resource files (${files.reduce((total, file) => total + file.size, 0)} bytes)`,
    );
  } catch (error) {
    removeGenerated(assets);
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await buildAssets();
}
