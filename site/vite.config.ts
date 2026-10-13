import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

import { createManifest, importMap } from "./manifest.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const manifest = createManifest();
const externals = Object.keys(importMap(manifest).imports);

export default defineConfig(({ command }) => ({
  root,
  base: process.env.PAGES_BASE_PATH || "/mdimg/",
  plugins: [
    {
      name: "preview-metadata",
      enforce: "pre",
      resolveId(id) {
        if (id === "virtual:site-manifest") return "\0site-manifest";
        if (command === "serve" && externals.includes(id))
          return {
            id: importMap(manifest, true).imports[
              id as keyof ReturnType<typeof importMap>["imports"]
            ],
            external: true,
          };
      },
      load(id) {
        if (id === "\0site-manifest")
          return `export default ${JSON.stringify(manifest)}`;
      },
      transformIndexHtml: {
        order: "post",
        handler() {
          return [
            {
              tag: "script",
              attrs: { type: "importmap" },
              children: JSON.stringify(
                importMap(manifest, command === "serve"),
              ),
              injectTo: "head-prepend",
            },
          ];
        },
      },
    },
  ],
  optimizeDeps: { exclude: externals },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        frame: resolve(root, "frame.html"),
      },
      external: externals,
    },
  },
}));
