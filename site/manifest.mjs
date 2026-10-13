import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packages = [
  "react",
  "react-dom",
  "marked",
  "dompurify",
  "html-to-image",
  "highlight.js",
  "mermaid",
  "mathjax",
  "@mathjax/mathjax-newcm-font",
  "katex",
];

export function createManifest(
  root = projectRoot,
  commit = process.env.GITHUB_SHA,
) {
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  commit = git("rev-parse", "--verify", `${commit || "HEAD"}^{commit}`);
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const lock = readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8");
  const versions = Object.fromEntries(
    packages.map((name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const version = lock.match(
        new RegExp(
          `^      ['"]?${escaped}['"]?:\\r?\\n        specifier: [^\\n]+\\r?\\n        version: ['"]?([0-9]+\\.[0-9]+\\.[0-9]+)`,
          "m",
        ),
      )?.[1];
      if (!version) throw new Error(`Missing exact lockfile version: ${name}`);
      return [name, version];
    }),
  );
  const files = git(
    "ls-tree",
    "-r",
    "--name-only",
    commit,
    "--",
    "template/css",
    "template/html",
  ).split(/\r?\n/);
  const templates = files
    .filter((file) => /^template\/css\/[^/]+\.css$/.test(file))
    .map((file) => {
      const name = file.slice("template/css/".length, -4);
      return {
        name,
        html: files.includes(`template/html/${name}.html`) ? name : "default",
      };
    });
  if (
    !templates.some((template) => template.name === "default") ||
    !files.includes("template/html/default.html")
  ) {
    throw new Error(
      "Deployment commit must contain the default CSS and HTML templates",
    );
  }
  const styles = resolve(root, "node_modules/highlight.js/styles");
  const highlightThemes = readdirSync(styles, { recursive: true })
    .filter(
      (name) =>
        typeof name === "string" &&
        name.endsWith(".css") &&
        !name.endsWith(".min.css"),
    )
    .map((name) => name.replace(/\\/g, "/").slice(0, -4))
    .sort();
  // Read the package's registered themes, including Mermaid 12's neo/redux families.
  const mermaidThemes = [
    ...readFileSync(
      resolve(root, "node_modules/mermaid/dist/themes/index.d.ts"),
      "utf8",
    ).matchAll(/^ {4}(?:'([^']+)'|([a-z]+)): \{/gm),
  ].map((match) => match[1] || match[2]);
  if (!mermaidThemes.includes("default"))
    throw new Error("Mermaid theme registry is missing");
  return {
    commit,
    packageVersion: pkg.version,
    assetBase: `https://cdn.jsdelivr.net/gh/LolipopJ/mdimg@${commit}/`,
    templates,
    highlightThemes,
    mermaidThemes,
    versions,
  };
}

export function importMap(manifest, development = false) {
  const v = manifest.versions;
  const dev = development ? "&dev" : "";
  return {
    imports: {
      react: `https://esm.sh/react@${v.react}${development ? "?dev" : ""}`,
      "react/jsx-runtime": `https://esm.sh/react@${v.react}/jsx-runtime?external=react${dev}`,
      "react/jsx-dev-runtime": `https://esm.sh/react@${v.react}/jsx-dev-runtime?external=react&dev`,
      "react-dom/client": `https://esm.sh/react-dom@${v["react-dom"]}/client?external=react${dev}`,
      marked: `https://esm.sh/marked@${v.marked}`,
      dompurify: `https://esm.sh/dompurify@${v.dompurify}`,
      "html-to-image": `https://esm.sh/html-to-image@${v["html-to-image"]}`,
    },
  };
}
