import DOMPurify from "dompurify";
import manifest from "virtual:site-manifest";

import { parseMarkdown } from "../../src/utils/mdParser";
import type { Config } from "./config";
import { exportImage } from "./export";
import { resourceUrl } from "./resources";

export type FrameApi = {
  start: (
    input: Omit<Config, "type" | "quality"> & { markdown: string },
  ) => void;
  ready: Promise<HTMLElement>;
  exportImage: (options: Pick<Config, "type" | "quality">) => Promise<Blob>;
};
declare global {
  interface Window {
    mdimgPreview?: FrameApi;
  }
}

const controller = new AbortController();
window.addEventListener("pagehide", () => controller.abort(), { once: true });
const signal = controller.signal;
const resourceFailures: string[] = [];
window.addEventListener(
  "error",
  (event) => {
    const target = event.target as HTMLElement | null;
    const url = target?.getAttribute?.("src") || target?.getAttribute?.("href");
    resourceFailures.push(
      url
        ? `Resource failed to load: ${url}`
        : event.message || "A rendering resource failed",
    );
  },
  true,
);

function checkResources() {
  signal.throwIfAborted();
  if (resourceFailures.length) throw new Error(resourceFailures.join("\n"));
}

async function text(url: string) {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Failed to load: ${url} (${response.status})`);
  return response.text();
}

function stylesheet(url: string) {
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.crossOrigin = "anonymous";
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Stylesheet failed to load: ${url}`));
    document.head.append(link);
  });
}

function script(url: string) {
  return new Promise<void>((resolve, reject) => {
    const element = document.createElement("script");
    element.src = url;
    element.crossOrigin = "anonymous";
    element.onload = () => resolve();
    element.onerror = () => reject(new Error(`Script failed to load: ${url}`));
    document.head.append(element);
  });
}

const cdn = (name: string, file: string) =>
  `https://cdn.jsdelivr.net/npm/${name}@${manifest.versions[name]}/${file}`;

async function render(
  config: Omit<Config, "type" | "quality"> & { markdown: string },
): Promise<HTMLElement> {
  const template = manifest.templates.find(
    (item) => item.name === config.cssTemplate,
  );
  if (!template) throw new Error(`Unknown template: ${config.cssTemplate}`);
  const html = await text(
    `${manifest.assetBase}template/html/${template.html}.html`,
  );
  const doc = new DOMParser().parseFromString(
    `<!doctype html>${html}`,
    "text/html",
  );
  const body = doc.querySelector(".markdown-body");
  if (!body || !doc.querySelector("#mdimg-body"))
    throw new Error(`Invalid template structure: ${template.html}`);
  body.innerHTML = DOMPurify.sanitize(await parseMarkdown(config.markdown), {
    USE_PROFILES: { html: true, svg: true, mathMl: true },
    FORBID_TAGS: ["style", "link", "base", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcset"],
  });
  for (const element of body.querySelectorAll("[src]")) {
    element.setAttribute("src", resourceUrl(element.getAttribute("src")!));
  }
  for (const image of body.querySelectorAll<SVGImageElement>("image")) {
    image.href.baseVal = resourceUrl(image.href.baseVal);
  }
  for (const link of body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href")!;
    if (!/^(#|mailto:|tel:)/i.test(href))
      link.setAttribute("href", resourceUrl(href));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  }
  document.head.append(...Array.from(doc.head.childNodes));
  document.body.append(...Array.from(doc.body.childNodes));
  await stylesheet(`${manifest.assetBase}template/css/${template.name}.css`);
  checkResources();
  if (config.highlightJs) {
    const theme = config.highlightTheme;
    if (!manifest.highlightThemes.includes(theme))
      throw new Error(`Unknown highlight theme: ${theme}`);
    await stylesheet(cdn("highlight.js", `styles/${theme}.css`));
    await script(
      `https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@${manifest.versions["highlight.js"]}/build/highlight.min.js`,
    );
    const hljs = (
      window as unknown as {
        hljs: { highlightElement: (node: Element) => void };
      }
    ).hljs;
    document
      .querySelectorAll("pre code")
      .forEach((node) => hljs.highlightElement(node));
  }
  if (config.mathJax) {
    const runtime = window as unknown as {
      MathJax: Record<string, unknown> & {
        startup: { promise: Promise<void> };
        typesetPromise: () => Promise<void>;
      };
    };
    const fail = (_jax: unknown, error: Error) => {
      throw error;
    };
    runtime.MathJax = {
      loader: {
        paths: {
          mathjax: cdn("mathjax", "").replace(/\/$/, ""),
          "mathjax-newcm": cdn("@mathjax/mathjax-newcm-font", "").replace(
            /\/$/,
            "",
          ),
        },
      },
      output: { font: "mathjax-newcm", fontPath: "[mathjax-newcm]" },
      svg: { fontCache: "local", dynamicPrefix: "[mathjax-newcm]/svg/dynamic" },
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        formatError: fail,
      },
      options: {
        compileError: (_doc: unknown, _math: unknown, error: Error) => {
          throw error;
        },
        typesetError: (_doc: unknown, _math: unknown, error: Error) => {
          throw error;
        },
      },
      startup: { typeset: false },
    } as unknown as typeof runtime.MathJax;
    await script(cdn("mathjax", "tex-mml-svg.js"));
    await runtime.MathJax.startup.promise;
    await runtime.MathJax.typesetPromise();
    if (document.querySelector("mjx-merror, [data-mjx-error]"))
      throw new Error("Math formula rendering failed");
  }
  if (config.mermaid) {
    await stylesheet(cdn("katex", "dist/katex.min.css"));
    const url = cdn("mermaid", "dist/mermaid.esm.min.mjs");
    const { default: mermaid } = await import(/* @vite-ignore */ url);
    mermaid.initialize({
      startOnLoad: false,
      theme: config.mermaidTheme,
    });
    await mermaid.run({
      nodes: document.querySelectorAll(".mermaid"),
      suppressErrors: false,
    });
    if (document.querySelector(".error-icon, .error-text"))
      throw new Error("Mermaid diagram rendering failed");
  }
  await Promise.all(
    Array.from(document.images, async (image) => {
      try {
        await image.decode();
      } catch {
        throw new Error(
          `Image failed to load: ${image.currentSrc || image.src}`,
        );
      }
      if (!image.naturalWidth)
        throw new Error(`Image has no content: ${image.src}`);
    }),
  );
  await document.fonts.ready;
  for (const font of document.fonts)
    if (font.status === "error")
      throw new Error(`Font failed to load: ${font.family}`);
  const root = document.querySelector<HTMLElement>("#mdimg-body")!;
  let previous = "";
  for (let i = 0; i < 120; i++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    checkResources();
    const bounds = root.getBoundingClientRect();
    const size = `${bounds.width},${bounds.height},${root.scrollHeight},${root.scrollWidth}`;
    if (size === previous) return root;
    previous = size;
  }
  throw new Error("Article layout did not stabilize");
}

let start!: FrameApi["start"];
const input = new Promise<Parameters<FrameApi["start"]>[0]>((resolve) => {
  start = resolve;
});
const ready = Promise.race([
  input.then(render),
  new Promise<never>((_, reject) => {
    const timeout = setTimeout(
      () =>
        reject(
          new Error("Resources timed out. Check the CDN connection and retry."),
        ),
      60000,
    );
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(signal.reason);
      },
      { once: true },
    );
  }),
]);
// Parent attaches after iframe load; retain rejection without an unhandled-rejection warning.
void ready.catch(() => {});
window.mdimgPreview = {
  start,
  ready,
  exportImage: async (options) => {
    const root = await ready;
    checkResources();
    return exportImage(root, options);
  },
};
