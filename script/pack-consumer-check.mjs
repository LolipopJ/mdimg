import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const managerCli = process.env.npm_execpath;
assert(managerCli, "Run pack-consumer-check through npm or pnpm run");
const nativeManager = path.extname(managerCli).toLowerCase() === ".exe";
const isPnpm = process.env.npm_config_user_agent?.startsWith("pnpm/");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mdimg-consumer-"));

function runManager(args, cwd, stdio = "inherit") {
  return execFileSync(
    nativeManager ? managerCli : process.execPath,
    nativeManager ? args : [managerCli, ...args],
    {
      cwd,
      encoding: "utf8",
      env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "true" },
      stdio,
    },
  );
}

try {
  // Suppress this nested pack's lifecycle to avoid recursing into prepack.
  runManager(
    [
      ...(isPnpm ? ["--config.ignore-scripts=true"] : ["--ignore-scripts"]),
      "pack",
      "--pack-destination",
      temporaryRoot,
    ],
    root,
    ["ignore", "pipe", "inherit"],
  );
  const tarballs = fs
    .readdirSync(temporaryRoot)
    .filter((filename) => filename.endsWith(".tgz"));
  assert.equal(tarballs.length, 1);
  const consumer = path.join(temporaryRoot, "consumer");
  fs.mkdirSync(consumer);
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({
      name: "mdimg-pack-consumer",
      private: true,
      dependencies: { mdimg: `file:../${tarballs[0]}` },
    }),
  );
  runManager(
    isPnpm
      ? ["install", "--ignore-scripts", "--lockfile=false"]
      : ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
    consumer,
  );
  // Execute both built entry files. ESM resource defaults are covered by item 1.
  const script = String.raw`
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const cjs = require('mdimg');
const esm = await import(pathToFileURL(require.resolve('mdimg/lib/mdimg.mjs')));
const htmlText = '<div id="mdimg-body"><div class="markdown-body"></div></div>';
for (const api of [cjs, esm]) {
  assert.equal(api.mdimg, api.convert2img);
  const result = await api.mdimg({
    inputText: '# Packed consumer', extensions: false,
    htmlText, cssText: 'body { color: black; }',
    outputProcessor: api.createHtmlOutputProcessor(),
  });
  assert.match(result.data, /<h1>Packed consumer<\/h1>/);
  assert.equal(result.path, undefined);
}
const result = await cjs.mdimg({
  inputText: '# Default resources', outputProcessor: cjs.createHtmlOutputProcessor(),
});
assert.match(result.data, /<h1>Default resources<\/h1>/);
assert.match(result.data, /hljs.highlightAll/);
assert.match(result.data, /mermaid/);
assert.match(result.data, /MathJax/);
assert(!fs.existsSync(require.resolve('mdimg/lib/mdimg.js').replace(/mdimg\.js$/, 'utils/extensions')));
`;
  fs.writeFileSync(path.join(consumer, "check.mjs"), script);
  execFileSync(process.execPath, ["check.mjs"], {
    cwd: consumer,
    stdio: "inherit",
  });
  console.log("Packed CJS/ESM HTML consumer checks passed");
} finally {
  assert.equal(path.dirname(temporaryRoot), os.tmpdir());
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
