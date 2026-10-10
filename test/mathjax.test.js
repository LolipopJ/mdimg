/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const fs = require("node:fs");
const path = require("node:path");
const puppeteer = requirePackage(__filename)("puppeteer");
const { findBrowser } = require("./helpers/browser");
const root = path.resolve(__dirname, "..");
describe("MATHJAX: offline SVG adapter", () => {
  let browser, adapter;
  const resources = {};
  beforeAll(async () => {
    const { mathJaxInputs } = await importPackage(
      path.join(root, "script/build-assets.mjs"),
    );
    adapter = fs.readFileSync(
      path.join(root, "src/browser/mathjax.js"),
      "utf8",
    );
    for (const { filename, output } of mathJaxInputs()) {
      resources[output] =
        `data:text/javascript;base64,${fs.readFileSync(filename).toString("base64")}`;
    }
    browser = await puppeteer.launch({
      executablePath: await findBrowser(),
      headless: true,
      args: ["--no-sandbox"],
    });
  });
  afterAll(async () => {
    if (browser) await browser.close();
  });
  async function render({
    html,
    config = {},
    remove,
    corrupt,
    noop,
    loadAll = false,
  }) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const requests = [];
    const scriptErrors = [];
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (/^https?:/.test(request.url())) {
        requests.push(request.url());
        void request.abort();
      } else void request.continue();
    });
    page.on("pageerror", (error) => scriptErrors.push(error.message));
    await page.setOfflineMode(true);
    const table = {
      ...resources,
    };
    if (remove) delete table[remove];
    if (corrupt) {
      table[corrupt] =
        `data:text/javascript;base64,${Buffer.from("throw new Error('damaged MathJax resource')").toString("base64")}`;
    }
    if (noop) table[noop] = "data:text/javascript,void(0)";
    try {
      await page.setContent(html);
      await page.addScriptTag({
        content: adapter,
      });
      const result = await page.evaluate(
        async (options, data, preload) => {
          const loaded = [];
          const table = new Proxy(data, {
            get(target, key) {
              loaded.push(key);
              return target[key];
            },
          });
          let error;
          let loadedForFormula;
          try {
            await Promise.race([
              globalThis.__mdimgMathJax(options, table),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Probe timeout")), 15000),
              ),
            ]);
            loadedForFormula = [...loaded];
            if (preload) {
              await globalThis.MathJax.startup.document.outputJax.font.loadDynamicFiles();
            }
          } catch (reason) {
            error = String(reason);
          }
          const containers = [
            ...document.querySelectorAll("mjx-container[jax='SVG']"),
          ];
          const svgs = containers.flatMap((container) => [
            ...container.querySelectorAll("svg"),
          ]);
          return {
            error,
            inputNames: globalThis.MathJax?.startup?.document?.inputJax?.map(
              (jax) => jax.name,
            ),
            outputName: globalThis.MathJax?.startup?.document?.outputJax?.name,
            loaded,
            loadedForFormula,
            count: containers.length,
            paths: containers.map(
              (container) => container.querySelectorAll("path[d]").length,
            ),
            localReferences: containers.every((container) =>
              [...container.querySelectorAll("use")].every((use) => {
                const ref =
                  use.getAttribute("href") || use.getAttribute("xlink:href");
                return (
                  ref?.startsWith("#") &&
                  container.querySelector(`[id="${ref.slice(1)}"]`)
                );
              }),
            ),
            boxes: svgs.map((svg) => {
              const box = svg.getBoundingClientRect();
              return [box.width, box.height];
            }),
          };
        },
        config,
        table,
        loadAll,
      );
      expect(requests).toEqual([]);
      return {
        ...result,
        scriptErrors,
      };
    } finally {
      await context.close();
    }
  }
  const formula = String.raw`<p>\(\require{cancel}\cancel{x}+\mathcal{ABC}\)</p><math display="block"><mrow><mi>x</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac></mrow></math>`;
  test("renders TeX and MathML with local SVG glyphs and all font ranges", async () => {
    const success = await render({
      html: formula,
      loadAll: true,
    });
    expect(success.error).toBeUndefined();
    expect(success.scriptErrors).toEqual([]);
    expect(success.count).toBe(2);
    expect(success.paths.every((count) => count > 0)).toBeTruthy();
    expect(
      success.boxes.every(([width, height]) => width > 0 && height > 0),
    ).toBeTruthy();
    expect(success.localReferences).toBeTruthy();
    expect(
      success.loaded.includes("mathjax/input/tex/extensions/cancel.js"),
    ).toBeTruthy();
    const glyph = success.loadedForFormula.find((name) =>
      name.includes("/svg/dynamic/"),
    );
    expect(glyph).toBeTruthy();
    const dynamicFiles = Object.keys(resources).filter((name) =>
      name.includes("/svg/dynamic/"),
    );
    expect(
      dynamicFiles.every((name) => success.loaded.includes(name)),
    ).toBeTruthy();
  });
  test("loads a configured TeX extension", async () => {
    const configured = await render({
      html: String.raw`<p>$\cancel{x}$</p>`,
      config: {
        loader: {
          load: ["[tex]/cancel"],
        },
        tex: {
          inlineMath: [["$", "$"]],
          packages: {
            "[+]": ["cancel"],
          },
        },
      },
    });
    expect(configured.error).toBeUndefined();
    expect(configured.scriptErrors).toEqual([]);
    expect(configured.count).toBe(1);
    expect(configured.paths[0] > 0).toBeTruthy();
    expect(
      configured.loaded.includes("mathjax/input/tex/extensions/cancel.js"),
    ).toBeTruthy();
  });
  test("supports TeX-only input", async () => {
    const texOnly = await render({
      html: String.raw`<p>\(x+1\)</p>`,
      config: {
        startup: {
          input: ["tex"],
        },
      },
    });
    expect(texOnly.error).toBeUndefined();
    expect(texOnly.inputNames).toEqual(["TeX"]);
    expect(texOnly.count).toBe(1);
    expect(texOnly.paths[0] > 0).toBeTruthy();
    expect(texOnly.scriptErrors).toEqual([]);
  });
  test("rejects a missing SVG glyph", async () => {
    // Discover the range in this case so it also works when run on its own.
    const success = await render({
      html: formula,
    });
    const requiredGlyph = success.loadedForFormula.find((name) =>
      name.includes("/svg/dynamic/"),
    );
    expect(requiredGlyph).toBeDefined();
    const result = await render({
      html: formula,
      remove: requiredGlyph,
    });
    expect(result.error).toMatch(/svg\/dynamic/);
    expect(result.error).not.toMatch(/Probe timeout/);
  });
  for (const [name, scenario, expected] of [
    [
      "invalid MathML",
      {
        html: "<math><mfrac><mi>x</mi></mfrac></math>",
      },
      /MathJax.*MathML.*Wrong number of children.*mfrac/i,
    ],
    [
      "noop TeX component",
      {
        html: formula,
        noop: "mathjax/input/tex.js",
      },
      /input\/tex.*register/i,
    ],
    [
      "missing TeX extension",
      {
        html: formula,
        remove: "mathjax/input/tex/extensions/cancel.js",
      },
      /cancel\.js/,
    ],
    [
      "missing startup",
      {
        html: formula,
        remove: "mathjax/startup.js",
      },
      /startup\.js/,
    ],
    [
      "damaged component",
      {
        html: formula,
        corrupt: "mathjax/input/tex.js",
      },
      /damaged MathJax resource/,
    ],
    [
      "missing font",
      {
        html: formula,
        remove: "mathjax-newcm/svg.js",
      },
      /mathjax-newcm\/svg\.js/,
    ],
    [
      "invalid TeX",
      {
        html: String.raw`<p>\(\frac{1}\)</p>`,
      },
      /MathJax/,
    ],
    [
      "remote loader",
      {
        html: formula,
        config: {
          loader: {
            load: ["https://example.com/extension.js"],
          },
        },
      },
      /offline|resource|remote/i,
    ],
    [
      "CHTML config",
      {
        html: formula,
        config: {
          chtml: {},
        },
      },
      /CHTML|chtml/,
    ],
    [
      "indirect speech engine",
      {
        html: formula,
        config: {
          loader: {
            load: ["a11y/semantic-enrich"],
          },
        },
      },
      /speech engine|a11y\/sre/,
    ],
    [
      "unpackaged extension font",
      {
        html: String.raw`<p>\(\ce{H2O}\)</p>`,
        config: {
          loader: {
            load: ["[tex]/mhchem"],
          },
          tex: {
            packages: {
              "[+]": ["mhchem"],
            },
          },
        },
      },
      /mathjax-mhchem-font-extension.*missing/,
    ],
    [
      "unpackaged font",
      {
        html: formula,
        config: {
          output: {
            font: "mathjax-stix2",
          },
        },
      },
      /font/,
    ],
  ]) {
    test(name, async () => {
      const result = await render(scenario);
      expect(result.error || "").toMatch(expected);
      expect(result.error).not.toMatch(/Probe timeout/);
    });
  }
});
