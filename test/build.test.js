/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let fixture;
let gateFixture;
const stages = ["lint", "typecheck", "build", "test", "consumer"];

beforeAll(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), "mdimg-build-"));
  for (const filename of [
    "src",
    "static",
    "template",
    "script/build.mjs",
    "rollup.config.js",
    "rollup.sass.config.js",
    "tsconfig.json",
    "package.json",
    ".babelrc",
  ]) {
    fs.cpSync(path.join(root, filename), path.join(fixture, filename), {
      recursive: true,
    });
  }
  fs.symlinkSync(
    path.join(root, "node_modules"),
    path.join(fixture, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  gateFixture = path.join(fixture, "gate");
  const executables = [
    "node_modules/eslint/bin/eslint.js",
    "node_modules/typescript/bin/tsc",
    "script/build.mjs",
    "node_modules/jest/bin/jest",
    "script/pack-consumer-check.mjs",
  ];
  for (const [index, filename] of executables.entries()) {
    const absolute = path.join(gateFixture, filename);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    const importFs = filename.endsWith(".mjs")
      ? "import fs from 'node:fs';"
      : "const fs = require('node:fs');";
    fs.writeFileSync(
      absolute,
      `${importFs}\nfs.appendFileSync(process.env.MDIMG_GATE_LOG, '${stages[index]}\\n');\nprocess.exitCode = process.env.MDIMG_GATE_FAIL === '${stages[index]}' ? 7 : 0;\n`,
    );
  }
  fs.writeFileSync(
    path.join(gateFixture, "node_modules/eslint/package.json"),
    '{"name":"eslint"}',
  );
  fs.copyFileSync(
    path.join(root, "script/prepack.mjs"),
    path.join(gateFixture, "script/prepack.mjs"),
  );
});

afterAll(() => {
  if (fixture && path.dirname(fixture) === os.tmpdir()) {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

function build(...args) {
  return spawnSync(process.execPath, ["script/build.mjs", ...args], {
    cwd: fixture,
    encoding: "utf8",
  });
}

test("BUILD: rejects stale artifacts and cleans obsolete declarations and CSS", () => {
  const stale = path.join(fixture, "lib/utils/extensions/obsolete.d.ts");
  fs.mkdirSync(path.dirname(stale), { recursive: true });
  fs.writeFileSync(stale, "export declare const obsolete: true;\n");
  fs.writeFileSync(path.join(fixture, "template/css/obsolete.css"), "old");
  const result = build("--check");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Generated files differ from source");
  expect(fs.existsSync(stale)).toBe(false);
  expect(fs.existsSync(path.join(fixture, "template/css/obsolete.css"))).toBe(
    false,
  );
  expect(fs.existsSync(path.join(fixture, "lib/mdimg.d.ts"))).toBe(true);
  expect(fs.existsSync(path.join(fixture, "template/css/default.css"))).toBe(
    true,
  );
}, 60000);

test("BUILD: rebuilding produces identical JS, declarations and CSS", () => {
  const result = build("--check");
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(
    fs.readFileSync(path.join(fixture, "lib/mdimg.js"), "utf8"),
  ).not.toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
}, 60000);

test("BUILD: CJS and ESM preserve source navigation and browser arguments", () => {
  const script = String.raw`
    const assert = require('node:assert/strict');
    const puppeteer = require('puppeteer');
    const launches = [];
    const navigations = [];
    let closed = 0;
    const launch = async (options) => {
      launches.push(options);
      return {
        async newPage() {
          return {
            async goto(url, options) { navigations.push(options); },
            async $() { return {}; },
          };
        },
        async close() { closed++; },
      };
    };
    require.cache[require.resolve('puppeteer')].exports = { launch };
    puppeteer.default.launch = launch;
    (async () => {
      (await import('puppeteer')).default.launch = launch;
      const apis = [require('./lib/mdimg.js'), await import('./lib/mdimg.mjs')];
      for (const api of apis) {
        const result = await api.mdimg({
          inputText: '# Built code', extensions: false, width: 640, height: 120,
          htmlText: '<div id="mdimg-body"><div class="markdown-body"></div></div>',
          cssText: 'body { color: black; }',
          puppeteerProps: { args: ['--caller-argument'] },
          outputProcessor: { format: 'test', async process() {
            return { data: Uint8Array.from([1, 2, 3]) };
          } },
        });
        assert.deepEqual([...result.data], [1, 2, 3]);
      }
      assert.equal(closed, 2);
      assert.deepEqual(navigations, [{ waitUntil: 'networkidle0' }, { waitUntil: 'networkidle0' }]);
      for (const options of launches) {
        assert.deepEqual(options.args,
          ['--window-size=640,120', '--no-sandbox', '--caller-argument']);
      }
    })().catch((error) => { console.error(error); process.exitCode = 1; });
  `;
  execFileSync(process.execPath, ["--eval", script], {
    cwd: fixture,
    stdio: "pipe",
  });
});

test("BUILD: Sass compilation failure exits nonzero", () => {
  fs.writeFileSync(
    path.join(fixture, "template/scss/words.scss"),
    '@use "mdimg-missing-sass-file";',
  );
  const result = build();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("mdimg-missing-sass-file");
}, 60000);

test.each(stages)(
  "PACK: a failed %s check stops subsequent stages",
  (stage) => {
    const log = path.join(gateFixture, `${stage}.log`);
    const result = spawnSync(process.execPath, ["script/prepack.mjs"], {
      cwd: gateFixture,
      encoding: "utf8",
      env: { ...process.env, MDIMG_GATE_LOG: log, MDIMG_GATE_FAIL: stage },
    });
    expect(result.status).toBe(7);
    expect(fs.readFileSync(log, "utf8").trim().split("\n")).toEqual(
      stages.slice(0, stages.indexOf(stage) + 1),
    );
  },
);

test("PACK: passing checks reach the tarball consumer stage", () => {
  const log = path.join(gateFixture, "success.log");
  const result = spawnSync(process.execPath, ["script/prepack.mjs"], {
    cwd: gateFixture,
    encoding: "utf8",
    env: { ...process.env, MDIMG_GATE_LOG: log, MDIMG_GATE_FAIL: "" },
  });
  expect(result.status).toBe(0);
  expect(fs.readFileSync(log, "utf8").trim().split("\n")).toEqual(stages);
});
