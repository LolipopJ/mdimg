import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lib = resolve(root, "lib");
const css = resolve(root, "template/css");
const rollupRoot = dirname(require.resolve("rollup/package.json"));
const rollupBin = resolve(
  rollupRoot,
  require("rollup/package.json").bin.rollup,
);

const run = (args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Build step failed: ${args.join(" ")}`);
};

rmSync(lib, { recursive: true, force: true });
rmSync(css, { recursive: true, force: true });
mkdirSync(css, { recursive: true });
try {
  run([rollupBin, "-c", "rollup.config.js", "--bundleConfigAsCjs"]);
  run(["script/build-assets.mjs"]);
  run([rollupBin, "-c", "rollup.sass.config.js", "--bundleConfigAsCjs"]);
  run([
    require.resolve("jest/bin/jest"),
    "--runInBand",
    "--runTestsByPath",
    "test/resources.test.js",
  ]);
} catch (error) {
  rmSync(lib, { recursive: true, force: true });
  rmSync(css, { recursive: true, force: true });
  throw error;
}
