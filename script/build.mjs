import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const outputDirectories = ["lib", "template/css"];

function snapshot() {
  const files = new Map();
  for (const directory of outputDirectories) {
    const absolute = path.resolve(root, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;
      const filename = path.join(entry.parentPath, entry.name);
      const contents = fs.readFileSync(filename, "utf8").replace(/\r\n/g, "\n");
      files.set(
        path.relative(root, filename),
        createHash("sha256").update(contents).digest("hex"),
      );
    }
  }
  return files;
}

const before = process.argv.includes("--check") ? snapshot() : undefined;

// Only these generated directories may be removed. Refuse redirected targets.
for (const directory of outputDirectories) {
  const absolute = path.resolve(root, directory);
  assert(absolute.startsWith(`${root}${path.sep}`));
  const parent = fs.realpathSync(path.dirname(absolute));
  assert(parent === root || parent.startsWith(`${root}${path.sep}`));
  if (fs.existsSync(absolute)) {
    assert(
      !fs.lstatSync(absolute).isSymbolicLink(),
      `${directory} is a symlink`,
    );
    fs.rmSync(absolute, { recursive: true, force: true });
  }
  fs.mkdirSync(absolute, { recursive: true });
}

const rollupCli = path.resolve(
  path.dirname(require.resolve("rollup/package.json")),
  "dist/bin/rollup",
);
for (const config of ["rollup.config.js", "rollup.sass.config.js"]) {
  const result = spawnSync(
    process.execPath,
    [rollupCli, "-c", config, "--bundleConfigAsCjs"],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (before) {
  const after = snapshot();
  const changed = [...new Set([...before.keys(), ...after.keys()])]
    .filter((filename) => before.get(filename) !== after.get(filename))
    .sort();
  if (changed.length) {
    console.error(`Generated files differ from source:\n${changed.join("\n")}`);
    process.exitCode = 1;
  }
}
