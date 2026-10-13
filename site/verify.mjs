import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import puppeteer from "puppeteer";
import { createServer, preview } from "vite";

const output = resolve("mdimg_output/site");
mkdirSync(output, { recursive: true });
const server = await preview({
  configFile: resolve("site/vite.config.ts"),
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
});
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const network = new Set();
const evidence = {};

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(65000);
  await page.setViewport({ width: 1440, height: 1000 });
  let frames = 0;
  await page.evaluateOnNewDocument(() => {
    if (location.port !== "4174" || location.pathname !== "/mdimg/") return;
    const original = window.fetch;
    const pending = new Promise((resolve) => {
      window.releasePreviewDocument = resolve;
    });
    window.fetch = async (...args) => {
      if (String(args[0]).endsWith("/test/static/test.md")) await pending;
      return original(...args);
    };
  });
  page.on("request", (request) => {
    network.add(request.url());
    if (request.url().includes("/frame.html")) frames++;
  });
  const settled = async () => {
    await page.waitForFunction(() =>
      document.querySelector(".status-ready, .status-error"),
    );
    const error = await page.$eval(".status", (node) => node.textContent);
    assert.equal(
      error,
      "Preview ready",
      (await page.evaluate(
        () => document.querySelector(".error-box")?.textContent,
      )) || error,
    );
  };
  const input = async (selector, value) =>
    page.$eval(
      selector,
      (node, text) => {
        const prototype =
          node.tagName === "TEXTAREA"
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, "value").set.call(
          node,
          text,
        );
        node.dispatchEvent(new Event("input", { bubbles: true }));
      },
      value,
    );
  const frameData = () =>
    page.evaluate(async () => {
      const win = document.querySelector("iframe").contentWindow;
      const root = await win.mdimgPreview.ready;
      return {
        title: root.querySelector("h1")?.textContent,
        text: root.textContent,
        math: root.querySelectorAll("mjx-container").length,
        diagram: root.querySelectorAll(".mermaid svg").length,
        highlighted: root.querySelectorAll("code.hljs").length,
        width: Math.ceil(root.getBoundingClientRect().width),
        height: Math.ceil(
          Math.max(root.getBoundingClientRect().height, root.scrollHeight),
        ),
        images: Array.from(root.querySelectorAll("img"), (image) => ({
          src: image.src,
          width: image.naturalWidth,
        })),
      };
    });
  await page.goto("http://127.0.0.1:4174/mdimg/", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".preview-loading", { timeout: 10000 });
  assert.equal(
    await page.$eval(".preview-window", (node) =>
      node.getAttribute("aria-busy"),
    ),
    "true",
  );
  await page.screenshot({ path: resolve(output, "loading.png") });
  await page.evaluate(() => window.releasePreviewDocument());
  await settled();
  assert.equal(await page.$(".preview-loading"), null);
  evidence.loadingOverlay = true;
  evidence.default = await frameData();
  assert(
    await page.evaluate(() =>
      Array.from(
        document
          .querySelector("iframe")
          .contentDocument.querySelectorAll(".markdown-body a[href]"),
      ).every(
        (link) => link.target === "_blank" && link.rel.includes("noopener"),
      ),
    ),
  );
  assert(
    evidence.default.math > 0 &&
      evidence.default.diagram > 0 &&
      evidence.default.highlighted > 0,
  );
  assert(
    evidence.default.images.every(
      (image) =>
        image.width > 0 &&
        image.src.startsWith(
          "https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/",
        ),
    ),
  );
  assert(
    !(await page.evaluate(() => {
      const panel = document.querySelector(".config-panel").cloneNode(true);
      panel.querySelector("textarea")?.remove();
      return /[\u4e00-\u9fff]/.test(panel.textContent);
    })),
  );
  const themes = await page.$$eval("#highlight-theme option", (options) =>
    options.map((option) => option.value),
  );
  assert(themes.includes("base16/dracula") && !themes.includes("auto"));
  evidence.highlightThemeCount = themes.length;
  assert.deepEqual(
    await page.$$eval("#mermaid-theme option", (options) =>
      options.map((option) => option.value),
    ),
    [
      "base",
      "dark",
      "default",
      "forest",
      "neutral",
      "neo",
      "neo-dark",
      "redux",
      "redux-dark",
      "redux-color",
      "redux-dark-color",
    ],
  );
  await page.screenshot({ path: resolve(output, "desktop.png") });

  // Export the real default article in all formats; decode and inspect its bottom pixels.
  for (const type of ["png", "jpeg", "webp"]) {
    const result = await page.evaluate(async (format) => {
      const win = document.querySelector("iframe").contentWindow;
      const root = await win.mdimgPreview.ready;
      const blob = await win.mdimgPreview.exportImage({
        type: format,
        quality: 100,
      });
      const bitmap = await win.createImageBitmap(blob);
      const canvas = win.document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const diagram = root
        .querySelector(".mermaid svg")
        .getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      const pixels = ctx.getImageData(
        0,
        Math.max(0, Math.floor(diagram.top - bounds.top)),
        canvas.width,
        Math.min(300, canvas.height - Math.floor(diagram.top - bounds.top)),
      ).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (
          pixels[i + 3] > 0 &&
          Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 150
        )
          ink++;
      const base64 = await new Promise((resolve) => {
        const reader = new win.FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return { ...dimensions, mime: blob.type, bytes: blob.size, ink, base64 };
    }, type);
    assert.equal(result.mime, `image/${type}`);
    assert.equal(result.width, evidence.default.width);
    assert.equal(result.height, evidence.default.height);
    assert(
      result.ink > 100,
      "The bottom diagram must appear in the decoded image",
    );
    writeFileSync(
      resolve(output, `default.${type}`),
      Buffer.from(result.base64, "base64"),
    );
    delete result.base64;
    evidence[type] = result;
  }
  console.log("Default article and PNG/JPEG/WebP exports verified.");

  const beforeFormats = frames;
  await page.select("#format", "webp");
  await input("#quality", "0");
  assert.equal(
    frames,
    beforeFormats,
    "Export options must not rerender the article",
  );
  assert(
    (await page.$eval("#call-code", (node) => node.textContent)).includes(
      "--quality 0",
    ),
  );
  await input("#width", "");
  assert(
    await page.$eval(
      "#width",
      (node) => node.getAttribute("aria-invalid") === "true",
    ),
  );
  assert.equal(frames, beforeFormats);
  await input("#width", "800");

  const initialFrames = frames;
  await input("#document-editor", "# Intermediate");
  await input(
    "#document-editor",
    "# Last edit\n\n```typescript\nconst value = 42;\n```\n\n$a+b$\n\n```mermaid\nflowchart LR\n A[Last] --> B[Edit]\n```\n\n<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E\" onload=\"parent.document.body.dataset.injected='yes'\">\n<script>parent.document.body.dataset.injected='yes'</script>",
  );
  assert.equal(frames, initialFrames, "Markdown edits must be debounced");
  assert(
    await page.$eval(".primary", (button) => button.disabled),
    "Unapplied edits must lock export",
  );
  await page.waitForFunction(
    () =>
      document.querySelector("iframe")?.contentDocument?.querySelector("h1")
        ?.textContent === "Last edit",
  );
  await settled();
  assert.equal(frames, initialFrames + 1);
  const edited = await frameData();
  assert(edited.math > 0 && edited.diagram > 0 && edited.highlighted > 0);
  assert.equal(
    await page.evaluate(() => document.body.dataset.injected),
    undefined,
  );
  evidence.editor = {
    debouncedFrames: frames - initialFrames,
    sanitized: true,
  };

  assert.equal(await page.$("#theme"), null);
  for (const [template, highlightTheme, mermaidTheme] of [
    ["githubDark", "atom-one-dark", "dark"],
    ["github", "atom-one-light", "default"],
  ]) {
    await page.select("#template", template);
    await page.waitForFunction(
      (highlight, mermaid) =>
        document.querySelector("#highlight-theme").value === highlight &&
        document.querySelector("#mermaid-theme").value === mermaid,
      {},
      highlightTheme,
      mermaidTheme,
    );
    await settled();
  }
  evidence.templateThemes = "dark and light defaults follow the CSS template";

  await page.select("#highlight-theme", "base16/dracula");
  await settled();
  for (const theme of [
    "forest",
    "dark",
    "neutral",
    "base",
    "default",
    "neo",
    "neo-dark",
    "redux",
    "redux-dark",
    "redux-color",
    "redux-dark-color",
  ]) {
    await page.select("#mermaid-theme", theme);
    await settled();
    assert((await frameData()).diagram > 0);
    assert(
      (await page.$eval("#call-code", (node) => node.textContent)).includes(
        `"theme":"${theme}"`,
      ),
    );
  }
  await input(
    "#document-editor",
    '# Formula labels\n\n```mermaid\nflowchart LR\n A["$$\\alpha + \\beta$$"] --> B["$$x^2$$"]\n```',
  );
  await settled();
  evidence.diagramFonts = await page.evaluate(async () => {
    const win = document.querySelector("iframe").contentWindow;
    const root = await win.mdimgPreview.ready;
    const labels = root.querySelectorAll("foreignObject .katex").length;
    const original = win.fetch;
    const requests = [];
    win.fetch = (...args) => {
      requests.push(String(args[0]));
      return original(...args);
    };
    try {
      const blob = await win.mdimgPreview.exportImage({
        type: "png",
        quality: 100,
      });
      return {
        labels,
        embeddedFonts: requests.filter((url) =>
          /\.(woff2?|ttf|otf)(?:\?|$)/.test(url),
        ).length,
        bytes: blob.size,
      };
    } finally {
      win.fetch = original;
    }
  });
  assert(
    evidence.diagramFonts.labels > 0,
    "The preview must contain Mermaid math labels",
  );
  assert(
    evidence.diagramFonts.embeddedFonts > 0,
    "Fonts inside Mermaid SVG labels must be embedded in the export",
  );
  await page.select("#template", "words");
  await settled();
  evidence.words = await page.$eval("#document-editor", (node) => node.value);
  assert(
    await page.evaluate(
      () =>
        !!document
          .querySelector("iframe")
          .contentDocument.querySelector("#mdimg-body .top"),
    ),
  );
  assert(
    network.has(
      "https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/test-template-words.md",
    ),
  );
  await page.select("#template", "github");
  await settled();
  assert((await frameData()).text.includes("Mermaid"));
  console.log(
    "Debounce, sanitation, words sample, extension themes and export-only changes verified.",
  );

  // Malformed diagrams and missing images must fail visibly and block export.
  await input("#document-editor", "```mermaid\nthis is not a diagram\n```");
  await page.waitForSelector(".status-error");
  assert(await page.$eval(".primary", (button) => button.disabled));
  await input("#document-editor", "![Missing](./missing-site-test-image.svg)");
  await page.waitForFunction(() =>
    document
      .querySelector(".error-box")
      ?.textContent.includes("missing-site-test-image.svg"),
  );
  assert(await page.$eval(".primary", (button) => button.disabled));
  await input("#document-editor", "# Recovered\n\nLive preview works again.");
  await page.waitForFunction(
    () =>
      document.querySelector("iframe")?.contentDocument?.querySelector("h1")
        ?.textContent === "Recovered",
  );
  await settled();

  await page.setViewport({ width: 390, height: 844 });
  const editedDocument = await page.$eval(
    "#document-editor",
    (node) => node.value,
  );
  await page.select("#template", "blueprint");
  await input("#width", "901");
  await page.waitForFunction(
    () => document.querySelector("iframe")?.style.width === "901px",
  );
  await settled();
  await page.select("#format", "jpeg");
  await input("#quality", "101");
  await input("#width", "");
  for (const checkbox of await page.$$(".check input")) {
    if (await checkbox.evaluate((node) => node.checked)) await checkbox.click();
  }
  await page.click(".reset");
  await settled();
  const reset = await page.evaluate(() => ({
    width: document.querySelector("#width").value,
    template: document.querySelector("#template").value,
    format: document.querySelector("#format").value,
    highlightTheme: document.querySelector("#highlight-theme").value,
    mermaidTheme: document.querySelector("#mermaid-theme").value,
    extensions: Array.from(
      document.querySelectorAll(".check input"),
      (node) => node.checked,
    ),
    invalid: document.querySelectorAll('[aria-invalid="true"]').length,
  }));
  assert.deepEqual(reset, {
    width: "800",
    template: "github",
    format: "png",
    highlightTheme: "github",
    mermaidTheme: "default",
    extensions: [true, true, true],
    invalid: 0,
  });
  assert.equal(
    await page.$eval("#document-editor", (node) => node.value),
    editedDocument,
  );
  await page.select("#format", "jpeg");
  assert.equal(await page.$eval("#quality", (node) => node.value), "100");
  evidence.reset = {
    defaultsRestored: true,
    editedDocumentPreserved: true,
    invalidInputsCleared: true,
  };
  await page.$eval("#mermaid-theme", (node) => node.focus());
  const focused = await page.$eval("#mermaid-theme", (node) => {
    const r = node.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  assert(focused, "Focused controls must remain visible on a narrow screen");
  await page.keyboard.press("Escape");
  assert.equal(
    await page.$eval(".panel-toggle", (node) =>
      node.getAttribute("aria-expanded"),
    ),
    "false",
  );
  assert(
    await page.evaluate(() =>
      document.activeElement.classList.contains("panel-toggle"),
    ),
  );
  await page.click(".panel-toggle");
  await page.screenshot({ path: resolve(output, "mobile.png") });
  evidence.narrowScreen = {
    focusedControlVisible: focused,
    escapeReturnsFocus: true,
  };
  evidence.network = [...network].filter((url) => /^https:/.test(url));
  assert(
    evidence.network.every(
      (url) =>
        url.startsWith("https://esm.sh/") ||
        url.startsWith("https://cdn.jsdelivr.net/") ||
        url.startsWith(
          "https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/",
        ),
    ),
    "Runtime resources must come from specified CDNs",
  );
  const development = await createServer({
    configFile: resolve("site/vite.config.ts"),
    server: { host: "127.0.0.1", port: 5174, strictPort: true },
  });
  try {
    await development.listen();
    network.clear();
    await page.goto(`http://127.0.0.1:5174${development.config.base}`, {
      waitUntil: "networkidle2",
    });
    await settled();
    // Vite's HMR client is development tooling; application runtimes must stay on CDN.
    const localRuntime = [...network].filter(
      (url) =>
        url.startsWith("http:") &&
        url.includes("/node_modules/") &&
        !url.includes("/vite/dist/client/"),
    );
    assert.deepEqual(localRuntime, []);
    evidence.development = {
      ready: true,
      localApplicationRuntime: localRuntime,
      cdnRequests: [...network].filter((url) =>
        url.startsWith("https://esm.sh/"),
      ).length,
    };
  } finally {
    await development.close();
  }
  writeFileSync(
    resolve(output, "verification.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(`PASS: browser checks; evidence in ${output}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
/* global document, innerHeight, HTMLInputElement, HTMLTextAreaElement, window, location */
