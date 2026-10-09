/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { execFileSync, spawnSync } = require("child_process");
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require("fs");
const { dirname, join, relative, resolve } = require("path");

const repository = resolve(__dirname, "..");
const cache = join(repository, "node_modules", ".cache");
let workspace;
let packedFiles;

beforeAll(() => {
  mkdirSync(cache, { recursive: true });
  workspace = mkdtempSync(join(cache, "mdimg-package-test-"));
  writeFileSync(
    join(workspace, "package.json"),
    JSON.stringify({ name: "mdimg-consumer-test", private: true }),
  );
  const args = [
    "pack",
    "--ignore-scripts",
    "--json",
    "--pack-destination",
    relative(repository, workspace),
  ];
  const windows = process.platform === "win32";
  const [pack] = JSON.parse(
    execFileSync(
      windows ? process.env.ComSpec : "npm",
      windows ? ["/d", "/s", "/c", `npm ${args.join(" ")}`] : args,
      { cwd: repository, encoding: "utf8", timeout: 30000 },
    ),
  );
  packedFiles = pack.files;
  const installedPackage = join(workspace, "node_modules", "mdimg");
  mkdirSync(installedPackage, { recursive: true });
  execFileSync("tar", [
    "-xzf",
    join(workspace, pack.filename),
    "-C",
    installedPackage,
    "--strip-components=1",
  ]);
});

afterAll(() => {
  if (workspace && dirname(workspace) === cache) {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test.each([
  [
    "CJS",
    "const { mdimg, convert2img, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } = require('mdimg');",
    "require.resolve('mdimg')",
    "mdimg.js",
  ],
  [
    "ESM",
    "import { mdimg, convert2img, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } from 'mdimg';",
    "import.meta.resolve('mdimg')",
    "mdimg.mjs",
  ],
])(
  "PACKAGE: %s entry converts HTML with default options",
  (mode, imports, resolution, entry) => {
    const file = join(
      workspace,
      mode === "ESM" ? "consumer.mjs" : "consumer.cjs",
    );
    writeFileSync(
      file,
      `${imports}
    (async () => {
      const result = await mdimg({ inputText: '# Packed consumer', outputProcessor: createHtmlOutputProcessor() });
      console.log(JSON.stringify({
        entry: ${resolution},
        alias: mdimg === convert2img,
        imageFactory: typeof createImageOutputProcessor,
        pdfFactory: typeof createPdfOutputProcessor,
        html: result.html.includes('<h1>Packed consumer</h1>'),
        data: result.data === result.html,
        styles: result.html.includes('highlight.js styles'),
        math: result.html.includes('MathJax options'),
        mermaid: result.html.includes('mermaid.initialize'),
      }));
    })();`,
    );
    const result = JSON.parse(
      execFileSync(process.execPath, [file], {
        encoding: "utf8",
        timeout: 10000,
      }),
    );
    expect(result.entry.endsWith(entry)).toBe(true);
    expect(result).toMatchObject({
      alias: true,
      imageFactory: "function",
      pdfFactory: "function",
      html: true,
      data: true,
      styles: true,
      math: true,
      mermaid: true,
    });
  },
);

const typesConsumer = `
import { mdimg, createHtmlOutputProcessor, createPdfOutputProcessor } from 'mdimg';
import type {
  IConvertOptions, IConvertResponse, IConvertTypeOption, IConvertEncodingOption,
  IOutputProcessor, IOutputProcessorContext, IOutputProcessorResult,
  IHighlightJsTheme, IExtensionOptions, IExtensionContext,
  IExtensionInjectResult, IExtension, IHooks, IPlugin,
} from 'mdimg';

const plugin: IPlugin = { name: 'consumer' };
const html: IOutputProcessor = createHtmlOutputProcessor();
const options: IConvertOptions = { inputText: '# Consumer', plugins: [plugin], outputProcessor: html };
const response: Promise<IConvertResponse> = mdimg(options);
mdimg({ inputText: '# HTML', outputFilename: 'out.html', outputProcessor: html });
mdimg({ inputText: '# PDF', outputFilename: 'out.pdf', outputProcessor: createPdfOutputProcessor() });
// @ts-expect-error Invalid encoding must retain its type error.
mdimg({ inputText: '# Consumer', encoding: 'utf8' });
// @ts-expect-error Internal runtime modules are not package entry points.
import { createMathJaxExtension } from 'mdimg/lib/extensions';
// @ts-expect-error Internal runtime modules are not package entry points.
import { createHtmlOutputProcessor as internalHtml } from 'mdimg/lib/output';
`;

test.each([
  ["NodeNext", ["mts", "cts"]],
  ["Bundler", ["ts"]],
])("PACKAGE: %s consumers can import every public type", (mode, extensions) => {
  for (const extension of extensions) {
    writeFileSync(join(workspace, `types.${extension}`), typesConsumer);
  }
  const config = join(workspace, `tsconfig.${mode}.json`);
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        module: mode === "NodeNext" ? "NodeNext" : "ESNext",
        moduleResolution: mode,
        target: "ES2022",
        strict: true,
        noEmit: true,
        types: [],
      },
      files: extensions.map((extension) => `types.${extension}`),
    }),
  );
  const result = spawnSync(
    process.execPath,
    [require.resolve("typescript/bin/tsc"), "--project", config],
    { encoding: "utf8", timeout: 30000 },
  );
  expect(result.error).toBeUndefined();
  expect(result.stdout + result.stderr).toBe("");
  expect(result.status).toBe(0);
});

test("PACKAGE: private paths reject both require and import", () => {
  const file = join(workspace, "private.mjs");
  writeFileSync(
    file,
    `import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    const results = [];
    for (const specifier of ['mdimg/lib/output', 'mdimg/lib/extensions', 'mdimg/lib/mdimg.mjs', 'mdimg/src/mdimg.ts']) {
      for (const load of [() => require(specifier), () => import(specifier)]) {
        try { await load(); results.push('loaded'); }
        catch (error) { results.push(error.code); }
      }
    }
    console.log(JSON.stringify(results));`,
  );
  const results = JSON.parse(
    execFileSync(process.execPath, [file], { encoding: "utf8" }),
  );
  expect(results).toEqual(Array(8).fill("ERR_PACKAGE_PATH_NOT_EXPORTED"));
});

test("PACKAGE: published declarations have current source files", () => {
  const orphanedDeclarations = packedFiles
    .filter(({ path }) => path.startsWith("lib/") && path.endsWith(".d.ts"))
    .filter(
      ({ path }) =>
        !existsSync(
          join(
            repository,
            path.replace(/^lib\//, "src/").replace(/\.d\.ts$/, ".ts"),
          ),
        ),
    )
    .map(({ path }) => path);
  expect(orphanedDeclarations).toEqual([]);
});

test("PACKAGE: type checks fail when installed declarations are missing", () => {
  writeFileSync(
    join(workspace, "missing-types.mts"),
    "import { mdimg } from 'mdimg'; void mdimg;",
  );
  const config = join(workspace, "tsconfig.missing-types.json");
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        strict: true,
        noEmit: true,
        types: [],
      },
      files: ["missing-types.mts"],
    }),
  );
  const declaration = join(
    workspace,
    "node_modules",
    "mdimg",
    "lib",
    "mdimg.d.mts",
  );
  const hiddenDeclaration = `${declaration}.hidden`;
  let result;
  renameSync(declaration, hiddenDeclaration);
  try {
    result = spawnSync(
      process.execPath,
      [require.resolve("typescript/bin/tsc"), "--project", config],
      { encoding: "utf8", timeout: 30000 },
    );
  } finally {
    renameSync(hiddenDeclaration, declaration);
  }
  expect(result.error).toBeUndefined();
  expect(result.status).not.toBe(0);
  expect(result.stdout).toContain("TS7016");
});
