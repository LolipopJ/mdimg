/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const { findBrowser, prepareOfflinePage } = require("./helpers/browser");
const {
  waitForReady,
  expectDocument,
  expectPng,
  expectOfflinePdf,
} = require("./helpers/offline-assertions");
const repository = resolve(__dirname, "..");
const packageRoot = resolve(process.env.MDIMG_PACKAGE_ROOT || repository);
const format = process.env.MDIMG_FORMAT || "esm";
const smokeOnly = process.env.MDIMG_SMOKE_ONLY === "true";
const fixture = String.raw`# Offline acceptance

Local attachment: ![offline attachment](attachment.svg)

<p>\(\frac{1}{2} + \mathbb{R} + \mathfrak{g}\)</p>

$$\require{color}\color{red}{x^2} + \unicode{x1D538} + \unicode{x29F5}$$

<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>

\`\`\`javascript
const answer = 42;
console.log("offline", answer);
\`\`\`

\`\`\`no-such-language
unknown language stays readable
\`\`\`

\`\`\`
plain code stays readable
\`\`\`

\`\`\`mermaid
flowchart TD
  A["$$x^2 + y^2 = z^2$$"] --> B["Offline end"]
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant A as Alice
  participant B as Bob
  A->>B: Offline message
\`\`\`
`.replaceAll("\\`", "`");
describe(`OFFLINE: ${format} rendering without network access`, () => {
  let api, browser, packagePuppeteer, originalLaunch, executablePath;
  let root, inputDirectory, relocated, baseOptions;
  let preparedApiPages, errorsExpected;
  const externalRequests = [];
  const pageErrors = [];
  beforeAll(async () => {
    executablePath = await findBrowser();
    const packageRequire = requirePackage(join(packageRoot, "package.json"));
    api = packageRequire(
      format === "cjs" ? "./lib/mdimg.js" : "./lib/mdimg.mjs",
    );
    const module = packageRequire("puppeteer");
    packagePuppeteer = module.default ?? module;
    browser = await packagePuppeteer.launch({
      executablePath,
      args: ["--no-sandbox"],
      defaultViewport: {
        width: 800,
        height: 600,
      },
    });
    originalLaunch = packagePuppeteer.launch;
    packagePuppeteer.launch = async (options) => {
      const instance = await originalLaunch.call(packagePuppeteer, options);
      const originalNewPage = instance.newPage.bind(instance);
      instance.newPage = async () => {
        const page = await originalNewPage();
        await prepareOfflinePage(page, externalRequests, pageErrors);
        preparedApiPages++;
        return page;
      };
      return instance;
    };
  });
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "mdimg-offline-"));
    inputDirectory = join(root, "输入 space # percent%");
    relocated = inputDirectory;
    mkdirSync(inputDirectory);
    const inputFilename = join(inputDirectory, "fixture.md");
    writeFileSync(inputFilename, fixture);
    writeFileSync(
      join(inputDirectory, "attachment.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="48"><rect width="96" height="48" fill="#dc4a36"/><circle cx="48" cy="24" r="16" fill="#fce8b2"/></svg>',
    );
    baseOptions = {
      inputFilename,
      puppeteerProps: {
        executablePath,
      },
      width: 800,
    };
    preparedApiPages = 0;
    errorsExpected = false;
    externalRequests.length = 0;
    pageErrors.length = 0;
  });
  afterEach(() => {
    try {
      expect(externalRequests).toEqual([]);
      if (!errorsExpected) expect(pageErrors).toEqual([]);
    } finally {
      if (root)
        rmSync(root, {
          recursive: true,
          force: true,
        });
    }
  });
  afterAll(async () => {
    if (originalLaunch) packagePuppeteer.launch = originalLaunch;
    if (browser) await browser.close();
  });
  async function openHtml(
    html,
    assertions,
    file = join(inputDirectory, "export.html"),
  ) {
    writeFileSync(file, html);
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    try {
      await prepareOfflinePage(page, externalRequests, pageErrors);
      await page.goto(pathToFileURL(file).href, {
        waitUntil: "load",
      });
      await waitForReady(page);
      return await assertions(page);
    } finally {
      await context.close();
    }
  }
  const outputHtml = (options = {}) =>
    api.mdimg({
      ...baseOptions,
      ...options,
      outputProcessor: api.createHtmlOutputProcessor(),
    });
  const modifyMathJaxResources = (transform) => ({
    name: "missing-resources",
    hooks: {
      afterSplice: (html) =>
        html.replace(
          /<\/body>(?=\s*<\/html>\s*$)/,
          `<script>const initialize=globalThis.__mdimgMathJax;globalThis.__mdimgMathJax=(config,resources)=>{${transform};return initialize(config,resources)};</script></body>`,
        ),
    },
  });
  test("relocated-light-html", async () => {
    const exported = await outputHtml({
      outputFilename: join(inputDirectory, "export.html"),
    });
    expect(exported.data).toBe(exported.html);
    expect(exported.html).not.toContain(pathToFileURL(packageRoot).href);
    relocated = join(root, "relocated 中文 space");
    renameSync(inputDirectory, relocated);
    baseOptions.inputFilename = join(relocated, "fixture.md");
    await openHtml(
      exported.html,
      expectDocument,
      join(relocated, "export.html"),
    );
  });
  if (!smokeOnly) {
    test("tex-only-input", async () => {
      const { html } = await outputHtml({
        inputFilename: undefined,
        inputText: String.raw`<div>\(x+1\)</div>`,
        extensions: {
          highlightJs: false,
          mermaid: false,
          mathJax: {
            startup: {
              input: ["tex"],
            },
          },
        },
      });
      return openHtml(
        html,
        async (page) => {
          const paths = await page.$$eval(
            'mjx-container[jax="SVG"] path[d]',
            (nodes) => nodes.length,
          );
          expect(paths > 0).toBeTruthy();
          return {
            paths,
          };
        },
        join(relocated, "tex-only.html"),
      );
    });
    for (const [name, options] of [
      [
        "dark",
        {
          theme: "dark",
        },
      ],
      [
        "brown-paper",
        {
          extensions: {
            highlightJs: {
              theme: "brown-paper",
            },
          },
        },
      ],
      [
        "base16",
        {
          extensions: {
            highlightJs: {
              theme: "base16/dracula",
            },
          },
        },
      ],
    ]) {
      test(`${name}-html`, async () => {
        const { html } = await outputHtml(options);
        const content = await openHtml(
          html,
          expectDocument,
          join(relocated, `${name}.html`),
        );
        if (name === "brown-paper")
          expect(content.codeBackground.startsWith('url("data:')).toBeTruthy();
        return {
          htmlBytes: Buffer.byteLength(html),
          content,
        };
      });
    }
    for (const [mode, options] of [
      [
        "config",
        {
          extensions: {
            mermaid: {
              forceLegacyMathML: true,
            },
          },
        },
      ],
      [
        "directive",
        {
          inputFilename: undefined,
          inputText: fixture.replace(
            "flowchart TD",
            '%%{init: {"forceLegacyMathML":true}}%%\nflowchart TD',
          ),
        },
      ],
    ])
      test(`legacy-math-${mode}-fonts-before-layout`, async () => {
        const { html } = await outputHtml({
          ...options,
          plugins: [
            {
              name: "font-proof",
              hooks: {
                afterSplice: (html) =>
                  html.replace(
                    /<\/body>(?=\s*<\/html>\s*$)/,
                    `<script>
          const originalRun = mermaid.run.bind(mermaid);
          mermaid.run = options => {
            if (Array.from(document.fonts).some(font => font.family.includes('KaTeX_') && font.status !== 'loaded')) {
              throw new Error('KaTeX fonts were not loaded before Mermaid layout');
            }
            return originalRun(options);
          };
        </script></body>`,
                  ),
              },
            },
          ],
        });
        return openHtml(
          html,
          async (page) => {
            const label = await page.$eval(".mermaid .katex-html", (node) => ({
              width: node.getBoundingClientRect().width,
              height: node.getBoundingClientRect().height,
            }));
            expect(label.width > 0 && label.height > 0).toBeTruthy();
            return {
              label,
            };
          },
          join(relocated, `legacy-${mode}.html`),
        );
      });
    test("bundled-architecture-icons", async () => {
      const { html } = await outputHtml({
        inputFilename: undefined,
        inputText:
          "```mermaid\narchitecture-beta\n service a(blank)[Blank]\n service b(mermaid-architecture:cloud)[Cloud]\n a:R -- L:b\n```",
      });
      return openHtml(
        html,
        async (page) => {
          expect(
            await page.$$eval(".mermaid > svg", (nodes) => nodes.length),
          ).toBe(1);
        },
        join(relocated, "architecture.html"),
      );
    });
    test("extensions-disabled", async () => {
      const { html } = await outputHtml({
        extensions: false,
      });
      return {
        content: await openHtml(
          html,
          (page) =>
            expectDocument(page, {
              math: false,
              mermaid: false,
              highlight: false,
            }),
          join(relocated, "disabled.html"),
        ),
      };
    });
    test("builtins-replaced", async () => {
      const { html } = await outputHtml({
        plugins: [
          {
            name: "replacements",
            extensions: ["highlightJs", "mathJax", "mermaid"].map((name) => ({
              name,
              inject: () => ({
                body: `<script>globalThis.replaced_${name}=true;</script>`,
              }),
            })),
          },
        ],
      });
      const content = await openHtml(
        html,
        async (page) => {
          const result = await expectDocument(page, {
            math: false,
            mermaid: false,
            highlight: false,
          });
          expect(
            await page.evaluate(() => [
              globalThis.replaced_highlightJs,
              globalThis.replaced_mathJax,
              globalThis.replaced_mermaid,
            ]),
          ).toEqual([true, true, true]);
          return result;
        },
        join(relocated, "replaced.html"),
      );
      return {
        content,
      };
    });
    test("inline-script-boundary", async () => {
      const { html } = await outputHtml({
        extensions: {
          highlightJs: {
            boundary:
              "</script><script>globalThis.offlineBoundary=true</script>",
          },
        },
      });
      return {
        content: await openHtml(
          html,
          async (page) => {
            expect(
              await page.evaluate(() => globalThis.offlineBoundary),
            ).toBeUndefined();
            return expectDocument(page);
          },
          join(relocated, "script-boundary.html"),
        ),
      };
    });
    test("standalone-html-error-diagnostic", async () => {
      errorsExpected = true;
      const { html } = await outputHtml({
        inputFilename: undefined,
        inputText: String.raw`$$\frac{1}$$`,
      });
      const file = join(relocated, "invalid-formula.html");
      writeFileSync(file, html);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      try {
        await prepareOfflinePage(page, externalRequests, pageErrors);
        await page.goto(pathToFileURL(file).href, {
          waitUntil: "load",
        });
        await expect(waitForReady(page)).rejects.toThrow(
          /mathjax|fraction|argument/i,
        );
        const diagnostic = await page.evaluate(() => globalThis.__mdimgError);
        expect(diagnostic).toMatch(/mathjax/i);
        return {
          diagnostic,
        };
      } finally {
        await context.close();
      }
    });
  }
  for (const [name, createProcessor, verify] of [
    [
      "png",
      () => api.createImageOutputProcessor("png", undefined, "binary"),
      (data) => expectPng(browser, data),
    ],
    ["pdf", () => api.createPdfOutputProcessor(), expectOfflinePdf],
  ]) {
    test(`api-${name}-offline`, async () => {
      const processor = createProcessor();
      const before = preparedApiPages;
      const result = await api.mdimg({
        ...baseOptions,
        outputFilename: join(relocated, `render.${name}`),
        outputProcessor: {
          ...processor,
          async process(context) {
            await expectDocument(context.page);
            return processor.process(context);
          },
        },
      });
      expect(existsSync(result.path)).toBeTruthy();
      expect(preparedApiPages).toBe(before + 1);
      return verify(result.data);
    });
  }
  if (!smokeOnly)
    for (const [name, options, diagnostic] of [
      ...[
        ["mindmap", "mindmap\n root\n  child\n   ::icon(missing:thing)"],
        [
          "kanban",
          "kanban\n column[Column]\n  task[Task]\n   ::icon(missing:thing)",
        ],
        ["usecase", 'usecase-beta\nactor User@{ icon: "missing:thing" }'],
      ].map(([name, source]) => [
        `unpackaged-${name}-icon`,
        {
          inputText: `\x60\x60\x60mermaid\n${source}\n\x60\x60\x60`,
          inputFilename: undefined,
        },
        /Mermaid.*icon.*missing:thing.*not packaged/i,
      ]),
      [
        "unpackaged-fontawesome-kit",
        {
          inputText: "```mermaid\nflowchart TD\n A[fak:fa-house Home]\n```",
          inputFilename: undefined,
        },
        /Mermaid.*Font Awesome.*not packaged/i,
      ],
      [
        "unpackaged-icon",
        {
          inputText:
            '```mermaid\nflowchart TD\n A@{ icon: "missing:thing", form: "square" }\n```',
          inputFilename: undefined,
        },
        /Mermaid.*icon.*missing:thing.*not packaged/i,
      ],
      [
        "unpackaged-layout",
        {
          inputText: "```mermaid\nflowchart TD\n A --> B\n```",
          inputFilename: undefined,
          extensions: {
            mermaid: {
              layout: "missing-layout",
            },
          },
        },
        /Mermaid.*layout.*missing-layout.*not packaged/i,
      ],
      [
        "unpackaged-layout-directive",
        {
          inputText:
            '```mermaid\n%%{init: {"layout":"missing-layout"}}%%\nflowchart TD\n A --> B\n```',
          inputFilename: undefined,
        },
        /Mermaid.*layout.*missing-layout.*not packaged/i,
      ],
      [
        "invalid-formula",
        {
          inputText: String.raw`$$\frac{1}$$`,
          inputFilename: undefined,
        },
        /mathjax|tex|formula|fraction/i,
      ],
      [
        "standalone-invalid-mathml",
        {
          inputText: "<math><mfrac><mi>x</mi></mfrac></math>",
          inputFilename: undefined,
          extensions: {
            highlightJs: false,
            mermaid: false,
          },
        },
        /MathJax.*MathML.*Wrong number of children.*mfrac/i,
      ],
      ...[
        [
          "png",
          () => api.createImageOutputProcessor("png", undefined, "binary"),
        ],
        ["pdf", () => api.createPdfOutputProcessor()],
      ].map(([format, outputProcessor]) => [
        `invalid-mathml-${format}`,
        {
          inputText: "<math><mfrac><mi>x</mi></mfrac></math>",
          inputFilename: undefined,
          extensions: {
            highlightJs: false,
            mermaid: false,
          },
          get outputProcessor() {
            return outputProcessor();
          },
        },
        /MathJax.*MathML.*Wrong number of children.*mfrac/i,
      ]),
      [
        "invalid-diagram",
        {
          inputText: "```mermaid\nflowchart TD\n A -->[\n```",
          inputFilename: undefined,
        },
        /mermaid|parse|diagram/i,
      ],
      [
        "missing-component",
        {
          inputText: String.raw`$$x$$`,
          inputFilename: undefined,
          extensions: {
            mathJax: {
              loader: {
                load: ["[tex]/missing-offline-component"],
              },
            },
            mermaid: false,
          },
        },
        /mathjax|missing-offline-component|resource/i,
      ],
      [
        "missing-dynamic-glyph",
        {
          plugins: [
            modifyMathJaxResources(
              'for(const name of Object.keys(resources)){if(name.startsWith("mathjax-newcm/svg/dynamic/"))delete resources[name]}',
            ),
          ],
        },
        /mathjax-newcm\/svg\/dynamic\/.+missing/i,
      ],
      [
        "missing-mathjax-script",
        {
          plugins: [
            {
              name: "missing-script",
              hooks: {
                afterSplice: (html) =>
                  html.replace(
                    /<script>([\s\S]*?)<\/script>/g,
                    (tag, source) =>
                      source.includes("__mdimgMathJax = async") ? "" : tag,
                  ),
              },
            },
          ],
        },
        /mathjax|__mdimgMathJax|function/i,
      ],
      [
        "noop-mathjax-component",
        {
          plugins: [
            modifyMathJaxResources(
              'resources["mathjax/input/tex.js"]="data:text/javascript,void(0)"',
            ),
          ],
        },
        /mathjax.*input\/tex\.js.*register/i,
      ],
      [
        "standalone-readiness-timeout",
        {
          extensions: false,
          plugins: [
            {
              name: "stalled-task",
              hooks: {
                afterSplice: (html) =>
                  html.replace(
                    /<\/body>(?=\s*<\/html>\s*$)/,
                    '<script>window.__mdimgTasks.push({name:"stalled-resource",run:()=>new Promise(()=>{})});</script></body>',
                  ),
              },
            },
          ],
        },
        /stalled-resource.*timeout/i,
      ],
      [
        "script-execution-failure",
        {
          extensions: false,
          plugins: [
            {
              name: "broken-script",
              extensions: [
                {
                  name: "broken",
                  inject: () => ({
                    body: '<script>throw new Error("offline-script-sentinel")</script>',
                  }),
                },
              ],
            },
          ],
        },
        /offline-script-sentinel|script|page/i,
      ],
      [
        "readiness-timeout",
        {
          extensions: false,
          plugins: [
            {
              name: "timeout",
              hooks: {
                afterSplice: (html) =>
                  html.replace(
                    /<\/body>(?=\s*<\/html>\s*$)/,
                    "<script>globalThis.__mdimgReady=new Promise(()=>{});</script></body>",
                  ),
              },
            },
          ],
        },
        /timeout|timed out/i,
      ],
    ]) {
      test(name, async () => {
        errorsExpected = true;
        if (
          name === "noop-mathjax-component" ||
          name === "standalone-invalid-mathml" ||
          name === "standalone-readiness-timeout"
        ) {
          const { html } = await outputHtml(options);
          const file = join(relocated, `${name}.html`);
          writeFileSync(file, html);
          const context = await browser.createBrowserContext();
          const page = await context.newPage();
          try {
            await prepareOfflinePage(page, externalRequests, pageErrors);
            await page.goto(pathToFileURL(file).href, {
              waitUntil: "load",
            });
            await expect(waitForReady(page, 35000)).rejects.toThrow(diagnostic);
            expect(await page.evaluate(() => globalThis.__mdimgError)).toMatch(
              diagnostic,
            );
          } finally {
            await context.close();
          }
          return {};
        }
        await expect(
          api.mdimg({
            ...baseOptions,
            ...options,
            encoding: "blob",
          }),
        ).rejects.toThrow(diagnostic);
        return {};
      });
    }
});
