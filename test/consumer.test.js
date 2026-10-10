/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { spawnSync } = require("node:child_process");
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { createRequire } = require("node:module");
const { dirname, isAbsolute, join, relative, resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = requirePackage(__filename)("puppeteer");
const { findBrowser } = require("./helpers/browser");
const { expectPng } = require("./helpers/offline-assertions");

const repository = resolve(__dirname, "..");
const metadata = require("../package.json");
const jestBin = require.resolve("jest/bin/jest");
const nodePaths = [process.execPath, process.env.MDIMG_NODE22];
if (process.platform === "win32") {
  nodePaths.push(
    join(
      process.env.LOCALAPPDATA ?? "",
      "Temp",
      "mdimg-review-node-22.12.0",
      "node-v22.12.0-win-x64",
      "node.exe",
    ),
  );
}
const nodes = [
  ...new Set(
    nodePaths
      .filter((filename) => filename && existsSync(filename))
      .map((filename) => realpathSync(filename)),
  ),
];
let workspace;
let consumer;
let packageRoot;
let packageRequire;
let consumerRequire;
let executablePath;
let environment;
let pack;

function inside(directory, filename) {
  const path = relative(realpathSync(directory), realpathSync(filename));
  return (
    path !== ".." &&
    !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) &&
    !isAbsolute(path)
  );
}

function run(
  node,
  args,
  { cwd = consumer, env = environment, timeout = 120000 } = {},
) {
  const result = spawnSync(node, args, {
    cwd,
    env,
    timeout,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  expect(result.error).toBeUndefined();
  if (result.status !== 0) {
    console.error(
      `${node} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
    );
  }
  expect(result.status).toBe(0);
  return result.stdout;
}

beforeAll(async () => {
  executablePath = await findBrowser();
  workspace = mkdtempSync(join(tmpdir(), "mdimg-packed-中文 space-"));
  environment = {
    ...process.env,
    NODE_PATH: "",
    PUPPETEER_SKIP_DOWNLOAD: "true",
    PUPPETEER_EXECUTABLE_PATH: executablePath,
  };
  const npm = [
    process.env.MDIMG_NPM,
    process.env.npm_execpath?.includes("npm-cli")
      ? process.env.npm_execpath
      : undefined,
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
  ].find((filename) => filename && existsSync(filename));
  if (!npm)
    throw new Error(
      "Cannot locate npm; set MDIMG_NPM to its JavaScript entry point",
    );
  const output = run(
    process.execPath,
    [npm, "pack", "--json", "--pack-destination", workspace],
    { cwd: repository, timeout: 360000 },
  );
  const start = output.search(/\[\s*\{\s*"id"/);
  expect(start).toBeGreaterThanOrEqual(0);
  [pack] = JSON.parse(output.slice(start));
  const tarball = join(workspace, pack.filename);
  consumer = join(workspace, "consumer 中文 space");
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify(
      {
        name: "mdimg-packed-consumer",
        private: true,
        dependencies: { mdimg: `file:${tarball.replaceAll("\\", "/")}` },
      },
      null,
      2,
    ),
  );
  run(process.execPath, [
    npm,
    "install",
    "--omit=dev",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ]);
  consumerRequire = createRequire(join(consumer, "package.json"));
  packageRoot = dirname(dirname(consumerRequire.resolve("mdimg")));
  packageRequire = createRequire(join(packageRoot, "package.json"));
}, 360000);

afterAll(() => {
  if (
    workspace &&
    dirname(workspace) === tmpdir() &&
    !process.env.MDIMG_KEEP_CONSUMER
  ) {
    rmSync(workspace, { recursive: true, force: true });
  } else if (workspace) {
    console.error(`Consumer artifacts: ${workspace}`);
  }
});

describe("CONSUMER: isolated production installation", () => {
  test("installs the built tarball outside the repository", () => {
    expect(inside(repository, workspace)).toBe(false);
    expect(inside(consumer, packageRoot)).toBe(true);
    expect(packageRequire("./package.json").version).toBe(metadata.version);
    expect(pack.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "lib/assets/manifest.json",
        "lib/assets/THIRD-PARTY-NOTICES.txt",
      ]),
    );
    expect(pack.files.some((file) => file.path.startsWith("static/"))).toBe(
      false,
    );
  });

  test.each(Object.keys(metadata.dependencies))(
    "resolves its own runtime dependency: %s",
    (dependency) => {
      const resolved = packageRequire.resolve(
        dependency.startsWith("@types/")
          ? `${dependency}/package.json`
          : dependency,
      );
      expect(inside(consumer, resolved)).toBe(true);
    },
  );

  test.each([
    "mathjax",
    "mermaid",
    "highlight.js",
    "github-markdown-css",
    "normalize.css",
    "typescript",
  ])("does not install the build dependency: %s", (dependency) => {
    expect(() => consumerRequire.resolve(dependency)).toThrow(
      expect.objectContaining({ code: "MODULE_NOT_FOUND" }),
    );
  });

  test("includes the declared minimum Node 22.12.0", () => {
    const versions = nodes.map((node) => run(node, ["--version"]).trim());
    expect(versions).toContain("v22.12.0");
    if (process.env.MDIMG_NODE22)
      expect(run(process.env.MDIMG_NODE22, ["--version"]).trim()).toBe(
        "v22.12.0",
      );
  });
});

test.each([
  ["NodeNext", "mts"],
  ["NodeNext", "cts"],
  ["Bundler", "ts"],
])("CONSUMER: public types resolve in %s / .%s", (mode, extension) => {
  const filename = `types.${extension}`;
  writeFileSync(
    join(consumer, filename),
    `
import { mdimg, convert2img, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } from "mdimg";
import type { IConvertOptions, IConvertResponse, IConvertTypeOption, IConvertEncodingOption, IOutputProcessor, IOutputProcessorContext, IOutputProcessorResult, IHighlightJsTheme, IExtensionOptions, IExtensionContext, IExtensionInjectResult, IExtension, IHooks, IPlugin } from "mdimg";
const theme: IHighlightJsTheme = "base16/dracula";
const options: IConvertOptions = { inputText: "# types", extensions: { highlightJs: { theme } }, outputProcessor: createHtmlOutputProcessor() };
const response: Promise<IConvertResponse> = mdimg(options);
void [response, convert2img, createImageOutputProcessor("png", undefined, "binary"), createPdfOutputProcessor()];
// @ts-expect-error Invalid encoding must retain its error.
mdimg({ inputText: "# invalid", encoding: "utf8" });
// @ts-expect-error Internal source paths are not public exports.
import "mdimg/src/mdimg.ts";
`,
  );
  const config = join(consumer, `tsconfig.${extension}.json`);
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        module: mode === "NodeNext" ? mode : "ESNext",
        moduleResolution: mode,
        target: "ES2022",
        strict: true,
        noEmit: true,
        types: [],
      },
      files: [filename],
    }),
  );
  run(process.execPath, [
    require.resolve("typescript/bin/tsc"),
    "--project",
    config,
  ]);
});

describe.each(nodes)("CONSUMER: Node %s", (node) => {
  test.each(["cjs", "mjs"])(
    "exports the API and renders HTML through %s",
    (mode) => {
      const imports =
        mode === "cjs"
          ? 'const api = require("mdimg");'
          : 'import * as api from "mdimg";';
      const filename = join(consumer, `api.${mode}`);
      writeFileSync(
        filename,
        `${imports}
(async () => {
  const result = await api.mdimg({ inputText: "# Packed consumer", outputProcessor: api.createHtmlOutputProcessor() });
  console.log(JSON.stringify({
    alias: api.mdimg === api.convert2img,
    processors: ["createHtmlOutputProcessor", "createImageOutputProcessor", "createPdfOutputProcessor"].map(name => typeof api[name]),
    heading: result.html.includes("<h1>Packed consumer</h1>"),
    sameData: result.data === result.html,
    readiness: result.html.includes("__mdimgReady"),
    node: process.version
  }));
})().catch(error => { console.error(error); process.exitCode = 1; });
`,
      );
      expect(JSON.parse(run(node, [filename], { cwd: tmpdir() }))).toEqual({
        alias: true,
        processors: ["function", "function", "function"],
        heading: true,
        sameData: true,
        readiness: true,
        node: run(node, ["--version"]).trim(),
      });
    },
  );

  test.each([
    ["esm", false],
    ["cjs", true],
  ])(
    "passes the %s offline Jest cases against the installed package",
    (format, smokeOnly) => {
      const output = run(
        node,
        [
          jestBin,
          "--runInBand",
          "--runTestsByPath",
          join(repository, "test/offline.test.js"),
          "--testTimeout",
          "60000",
          "--json",
          "--silent",
        ],
        {
          cwd: repository,
          env: {
            ...environment,
            MDIMG_PACKAGE_ROOT: packageRoot,
            MDIMG_FORMAT: format,
            MDIMG_SMOKE_ONLY: String(smokeOnly),
          },
          timeout: 360000,
        },
      );
      const result = JSON.parse(output);
      expect(result.success).toBe(true);
      expect(result.testResults).toHaveLength(1);
      expect(result.numTotalTests).toBeGreaterThan(0);
      expect(result.numFailedTests).toBe(0);
      expect(result.numPendingTests).toBe(0);
      expect(result.numPassedTests).toBe(result.numTotalTests);
    },
  );

  test("prints the CLI version", () => {
    expect(
      run(node, [join(packageRoot, "bin/mdimg.js"), "--version"], {
        cwd: tmpdir(),
      }).trim(),
    ).toBe(metadata.version);
  });

  test("renders visible CLI PNG content offline with Chinese and spaced paths", async () => {
    const driver = join(consumer, "cli-driver.mjs");
    writeFileSync(
      driver,
      `
import { createRequire } from "node:module";
import { prepareOfflinePage } from ${JSON.stringify(pathToFileURL(join(__dirname, "helpers/browser.js")).href)};
const packageRequire = createRequire(${JSON.stringify(join(packageRoot, "package.json"))});
const puppeteer = packageRequire("puppeteer").default;
const requests = [], errors = [];
let prepared = 0;
const launch = puppeteer.launch.bind(puppeteer);
puppeteer.launch = async options => {
  const browser = await launch(options);
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async () => {
    const page = await newPage();
    await prepareOfflinePage(page, requests, errors);
    prepared++;
    return page;
  };
  return browser;
};
process.on("beforeExit", () => console.log(JSON.stringify({ prepared, requests, errors })));
await import(${JSON.stringify(pathToFileURL(join(packageRoot, "bin/mdimg.js")).href)});
`,
    );
    const source = join(consumer, "CLI 输入 space.md");
    const output = join(
      consumer,
      `CLI 输出 space ${run(node, ["--version"]).trim()}.png`,
    );
    writeFileSync(
      source,
      "# Offline CLI\n\n" + "Rendered command line content.\n\n".repeat(12),
    );
    expect(
      JSON.parse(
        run(
          node,
          [driver, "--input", source, "--output", output, "--width", "800"],
          { cwd: tmpdir() },
        ),
      ),
    ).toEqual({ prepared: 1, requests: [], errors: [] });
    const browser = await puppeteer.launch({
      executablePath,
      args: ["--no-sandbox"],
    });
    try {
      await expectPng(browser, readFileSync(output));
    } finally {
      await browser.close();
    }
  });
});
