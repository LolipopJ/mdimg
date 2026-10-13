const { execFileSync, spawnSync } = require("child_process");
const {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require("fs");
const { dirname, join, relative, resolve } = require("path");
const typesConsumer = require("./helpers/public-types");
const ts = require("typescript");

const repository = resolve(__dirname, "..");
const cache = join(repository, "node_modules", ".cache");
let workspace;
let packed;

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
  packed = new Set(pack.files.map((file) => file.path));
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
    "const { mdimg, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } = require('mdimg');",
    "require.resolve('mdimg')",
    "mdimg.js",
  ],
  [
    "ESM",
    "import { mdimg, createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor } from 'mdimg';",
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
      const result = await mdimg({ inputText: '# Packed consumer\\n\\nThis is a **test** document.\\n\\n\`\`\`js\\nconsole.log("hi");\\n\`\`\`', outputProcessor: createHtmlOutputProcessor() });
      console.log(JSON.stringify({
        entry: ${resolution},
        imageFactory: typeof createImageOutputProcessor,
        pdfFactory: typeof createPdfOutputProcessor,
        html: result.html.includes('<h1>Packed consumer</h1>'),
        strong: result.html.includes('<strong>test</strong>'),
        code: result.html.includes('console.log("hi");'),
        data: result.data === result.html,
        path: result.path ?? null,
        styles: result.html.includes('highlight.js styles'),
        math: result.html.includes('__mdimgMathJax'),
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
      imageFactory: "function",
      pdfFactory: "function",
      html: true,
      strong: true,
      code: true,
      data: true,
      path: null,
      styles: true,
      math: true,
      mermaid: true,
    });
  },
);

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

test.each([
  ["NodeNext", "mts"],
  ["NodeNext", "cts"],
  ["Bundler", "ts"],
])(
  "PACKAGE: %s %s types work without bundled build dependencies",
  (mode, extension) => {
    const file = join(workspace, `isolated-types.${extension}`);
    writeFileSync(file, typesConsumer);
    const options = {
      module:
        mode === "NodeNext" ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind[mode],
      target: ts.ScriptTarget.ES2022,
      strict: true,
      noEmit: true,
      types: [],
    };
    const host = ts.createCompilerHost(options);
    // The packed package must not resolve these through the repository's devDependencies.
    host.resolveModuleNames = (names, containingFile) =>
      names.map((name) =>
        /^(highlight\.js|mermaid|dompurify|trusted-types)(\/|$)/.test(name)
          ? undefined
          : ts.resolveModuleName(name, containingFile, options, host)
              .resolvedModule,
      );
    const program = ts.createProgram([file], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(ts.formatDiagnosticsWithColorAndContext(diagnostics, host)).toBe("");
  },
);

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

test("PACKAGE: publishes the manifest and every offline asset", () => {
  expect(packed.has("lib/assets/manifest.json")).toBe(true);
  const manifest = JSON.parse(
    readFileSync(join(repository, "lib/assets/manifest.json"), "utf8"),
  );
  expect(manifest.files.length).toBeGreaterThan(0);
  for (const { path } of manifest.files) {
    expect(packed.has(`lib/assets/${path}`)).toBe(true);
  }
  expect(packed.has("lib/assets/THIRD-PARTY-NOTICES.txt")).toBe(true);
});

test("PACKAGE: publishes every compiled CSS template", () => {
  const templates = readdirSync(join(repository, "template/css"), {
    recursive: true,
  }).filter((filename) => filename.endsWith(".css"));
  expect(templates.length).toBeGreaterThan(0);
  for (const filename of templates) {
    expect(packed.has(`template/css/${filename.replaceAll("\\", "/")}`)).toBe(
      true,
    );
  }
});

test("PACKAGE: publishes every public entry point", () => {
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
    expect(packed.has(target.replace(/^\.\//, ""))).toBe(true);
  }
});

test("PACKAGE: publishes every declaration file", () => {
  const declarations = readdirSync(join(repository, "lib"), {
    recursive: true,
  }).filter((filename) => /\.d\.(?:ts|mts)$/.test(filename));
  expect(declarations.length).toBeGreaterThan(0);
  for (const filename of declarations) {
    expect(packed.has(`lib/${filename.replaceAll("\\", "/")}`)).toBe(true);
  }
});

test("PACKAGE: omits obsolete static resources", () => {
  expect([...packed].some((filename) => filename.startsWith("static/"))).toBe(
    false,
  );
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
