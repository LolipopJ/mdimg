const { mdimg, createHtmlOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} = require("node:fs");
const { resolve } = require("node:path");
const puppeteerModule = requirePackage(__filename)("puppeteer");
const puppeteer = puppeteerModule.default ?? puppeteerModule;
const { findBrowser, prepareOfflinePage } = require("./helpers/browser");
const { useWorkspace } = require("./helpers/workspace");
const workspace = useWorkspace();

test("READINESS: exported HTML includes readiness with disabled extensions", async () => {
  const { html } = await mdimg({
    inputText: "# Offline",
    extensions: false,
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(html).toContain("__mdimgReady");
  expect(html).toContain("__mdimgTasks");
  expect(html).not.toContain('name: "mathJax"');
});

test("READINESS: extension configuration cannot terminate its script element", async () => {
  const { html } = await mdimg({
    inputText: "```js\nconst a = 1;\n```",
    extensions: {
      highlightJs: {
        classPrefix: "</script><script>globalThis.injected=true</script>",
      },
      mathJax: false,
      mermaid: false,
    },
    outputProcessor: createHtmlOutputProcessor(),
  });
  expect(html).not.toContain("<script>globalThis.injected=true</script>");
  expect(html).toContain("\\u003c/script\\u003e");
});

test("READINESS: unknown theme fails clearly before rendering", async () => {
  await expect(
    mdimg({
      inputText: "# Offline",
      extensions: {
        highlightJs: { theme: "../missing-theme" },
        mathJax: false,
        mermaid: false,
      },
      outputProcessor: createHtmlOutputProcessor(),
    }),
  ).rejects.toThrow(/highlightJs.*unknown theme/i);
});

describe("READINESS: browser lifecycle", () => {
  let browser, page, launchSpy, preparePage;
  const externalRequests = [];
  const pageErrors = [];
  const consoleErrors = [];
  beforeEach(() => {
    externalRequests.length = pageErrors.length = consoleErrors.length = 0;
    preparePage = async (page) =>
      prepareOfflinePage(page, externalRequests, pageErrors, { consoleErrors });
    const launch = puppeteer.launch.bind(puppeteer);
    launchSpy = jest
      .spyOn(puppeteer, "launch")
      .mockImplementation(async (options) => {
        browser = await launch(options);
        const newPage = browser.newPage.bind(browser);
        browser.newPage = async () => {
          page = await newPage();
          await preparePage(page);
          return page;
        };
        return browser;
      });
  });
  afterEach(async () => {
    launchSpy.mockRestore();
    if (browser?.connected) await browser.close();
    browser = page = undefined;
    expect(externalRequests).toEqual([]);
  });
  const options = () => ({
    inputFilename: workspace.inputFilename,
    extensions: false,
    puppeteerProps: { args: ["--disable-extensions"] },
  });
  const spliceScript = (script) => ({
    name: "readiness-probe",
    hooks: {
      afterSplice: (html) =>
        html.replace("</body>", `<script>${script}</script></body>`),
    },
  });
  const expectCleaned = () => {
    expect(page.isClosed()).toBe(true);
    expect(browser.connected).toBe(false);
    expect(
      readdirSync(workspace.dir).filter((file) =>
        file.startsWith(".mdimg_temp_"),
      ),
    ).toEqual([]);
  };

  test.each(["image", "font"])(
    "waits for extensions and late resources when %s finishes first",
    async (first) => {
      const pageCreated = Promise.withResolvers();
      const held = {
        image: Promise.withResolvers(),
        font: Promise.withResolvers(),
      };
      preparePage = async (page) => {
        await prepareOfflinePage(page, externalRequests, pageErrors, {
          consoleErrors,
          handleLocalRequest(request) {
            const kind = request.url().endsWith("delayed.svg")
              ? "image"
              : request.url().endsWith("delayed.woff2")
                ? "font"
                : undefined;
            if (!kind) return false;
            held[kind].resolve(request);
            return true;
          },
        });
        pageCreated.resolve(page);
      };
      const process = jest.fn(async ({ page }) => {
        const state = await page.evaluate(() => ({
          events: globalThis.readinessEvents,
          imageWidth:
            document.querySelector("#delayed-image")?.naturalWidth ?? 0,
          fonts: Array.from(document.fonts, (font) => font.status),
          samePromise: globalThis.originalReady === globalThis.__mdimgReady,
        }));
        expect(state.imageWidth).toBe(64);
        expect(state.fonts).toEqual(["loaded"]);
        expect(state.samePromise).toBe(true);
        expect(state.events).toEqual([
          "extension-start",
          "extension-end",
          "ready",
        ]);
        return { data: "resources ready" };
      });
      const conversion = mdimg({
        ...options(),
        puppeteerProps: {
          executablePath: await findBrowser(),
          args: ["--disable-extensions"],
        },
        outputFilename: resolve(workspace.dir, "ready.txt"),
        outputProcessor: { format: "txt", requiresPage: true, process },
        plugins: [
          spliceScript(`
        globalThis.readinessEvents = [];
        globalThis.originalReady = globalThis.__mdimgReady;
        globalThis.__mdimgReady.then(() => globalThis.readinessEvents.push('ready'));
        globalThis.__mdimgTasks.push({ name: 'controlled-extension', async run() {
          globalThis.readinessEvents.push('extension-start');
          await new Promise(resolve => globalThis.releaseExtension = resolve);
          globalThis.readinessEvents.push('extension-end');
          const image = new Image();
          image.id = 'delayed-image';
          image.src = 'delayed.svg';
          document.querySelector('.markdown-body').append(image);
          const font = new FontFace('ReadinessFont', 'url(delayed.woff2)');
          document.fonts.add(font);
          font.load();
        }});
      `),
        ],
      });
      // An early conversion failure wakes every gate instead of leaving the test hung.
      const ended = conversion.then(() => {
        throw new Error("processor ran before resources were released");
      });
      ended.catch(() => {});
      const beforeCompletion = (operation) => Promise.race([operation, ended]);
      await beforeCompletion(pageCreated.promise);
      await beforeCompletion(
        page.waitForFunction(
          () =>
            document.readyState === "complete" && globalThis.releaseExtension,
        ),
      );
      expect(process).not.toHaveBeenCalled();
      expect(await page.evaluate(() => globalThis.readinessEvents)).toEqual([
        "extension-start",
      ]);
      await page.evaluate(() => globalThis.releaseExtension());
      const image = await beforeCompletion(held.image.promise);
      const font = await beforeCompletion(held.font.promise);
      const fontData = readFileSync(
        resolve(__dirname, "../lib/assets/katex.css"),
        "utf8",
      ).match(/data:font\/woff2;base64,([^"']+)/)[1];
      const release = {
        image: () =>
          image.respond({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="red"/></svg>',
          }),
        font: () =>
          font.respond({
            contentType: "font/woff2",
            body: Buffer.from(fontData, "base64"),
          }),
      };
      await release[first]();
      await beforeCompletion(
        page.waitForFunction(
          (kind) =>
            kind === "image"
              ? document.querySelector("#delayed-image").naturalWidth === 64
              : Array.from(document.fonts).every(
                  (font) => font.status === "loaded",
                ),
          {},
          first,
        ),
      );
      expect(process).not.toHaveBeenCalled();
      expect(await page.evaluate(() => globalThis.readinessEvents)).toEqual([
        "extension-start",
        "extension-end",
      ]);
      await release[first === "image" ? "font" : "image"]();
      const result = await conversion;
      expect(process).toHaveBeenCalledTimes(1);
      expect(result.data).toBe("resources ready");
      expect(readFileSync(result.path, "utf8")).toBe("resources ready");
      expect(launchSpy.mock.calls[0][0].args).toContain("--disable-extensions");
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expectCleaned();
    },
  );

  test.each(["absent", "existing"])(
    "image failure preserves %s target and skips the processor",
    async (target) => {
      writeFileSync(
        workspace.inputFilename,
        '<img src="data:image/png;base64,broken" alt="broken">',
      );
      const outputFilename = resolve(workspace.dir, "failed.txt");
      if (target === "existing")
        writeFileSync(outputFilename, "original target");
      const process = jest.fn(() => ({ data: "must not be written" }));
      await expect(
        mdimg({
          ...options(),
          outputFilename,
          outputProcessor: { format: "txt", requiresPage: true, process },
        }),
      ).rejects.toThrow(/images\/fonts.*image.*failed to load/i);
      expect(process).not.toHaveBeenCalled();
      if (target === "existing")
        expect(readFileSync(outputFilename, "utf8")).toBe("original target");
      else expect(existsSync(outputFilename)).toBe(false);
      expect(
        consoleErrors.some((message) =>
          /images\/fonts.*image.*failed to load/i.test(message),
        ),
      ).toBe(true);
      expectCleaned();
    },
  );

  test.each([
    [
      "missing bootstrap",
      (html) => html.replace(/<script>[\s\S]*?<\/script>/, ""),
      /missing page readiness Promise/i,
    ],
    [
      "failed extension",
      (html) =>
        html.replace(
          "</body>",
          '<script>__mdimgTasks.push({name:"broken-extension",run:()=>Promise.reject(new Error("extension-sentinel"))});</script></body>',
        ),
      /broken-extension.*extension-sentinel/i,
    ],
  ])(
    "%s skips processing and cleans the browser and temporary HTML",
    async (_name, afterSplice, diagnostic) => {
      const process = jest.fn(() => ({ data: "must not be written" }));
      const outputFilename = resolve(workspace.dir, "failed.txt");
      await expect(
        mdimg({
          ...options(),
          outputFilename,
          plugins: [{ name: "failure", hooks: { afterSplice } }],
          outputProcessor: { format: "txt", requiresPage: true, process },
        }),
      ).rejects.toThrow(diagnostic);
      expect(process).not.toHaveBeenCalled();
      expect(existsSync(outputFilename)).toBe(false);
      expectCleaned();
    },
  );

  test("processor failure closes the browser and preserves the target", async () => {
    const outputFilename = resolve(workspace.dir, "failed.txt");
    writeFileSync(outputFilename, "original target");
    await expect(
      mdimg({
        ...options(),
        outputFilename,
        outputProcessor: {
          format: "txt",
          requiresPage: true,
          process() {
            throw new Error("processor-sentinel");
          },
        },
      }),
    ).rejects.toThrow("processor-sentinel");
    expect(readFileSync(outputFilename, "utf8")).toBe("original target");
    expectCleaned();
  });
});
