import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const checks = [
  [
    path.join(
      path.dirname(require.resolve("eslint/package.json")),
      "bin/eslint.js",
    ),
    ".",
  ],
  [require.resolve("typescript/bin/tsc"), "--noEmit", "--incremental", "false"],
  ["script/build.mjs"],
  [
    require.resolve("jest/bin/jest"),
    "--roots",
    "test",
    "--runInBand",
    "--testTimeout",
    "60000",
    "--testPathIgnorePatterns",
    "preview.test.js",
  ],
  ["script/pack-consumer-check.mjs"],
];

for (const args of checks) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
