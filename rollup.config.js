import { writeFileSync } from "node:fs";

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { generateDtsBundle } from "dts-bundle-generator";
import license from "rollup-plugin-license";
import typescript from "rollup-plugin-typescript2";

const externalModules = ["cheerio", "marked", "puppeteer"];

const pluginsArray = [
  nodeResolve({ preferBuiltins: true }),
  typescript({ clean: true }),
  commonjs(),
  babel({ babelHelpers: "bundled" }),
  terser(),
  license({
    banner: `<%= pkg.name %> - convert markdown to image
Version: <%= pkg.version %>
Homepage: <%= pkg.homepage %>
Copyright (c) 2022, LolipopJ. (MIT Licensed)`,
  }),
];

export default [
  {
    input: "src/mdimg.ts",
    output: {
      file: "lib/mdimg.js",
      format: "cjs",
      exports: "auto",
      interop: "auto",
    },
    external: externalModules,
    plugins: [...pluginsArray],
  },
  {
    input: "src/mdimg.ts",
    output: {
      file: "lib/mdimg.mjs",
      format: "esm",
      intro: "const __dirname = import.meta.dirname;",
    },
    external: externalModules,
    plugins: [
      ...pluginsArray,
      {
        name: "declarations",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "mdimg.d.mts",
            source: 'export * from "./mdimg.js";\n',
          });
        },
        writeBundle() {
          const file = "lib/interfaces/index.d.ts";
          const [declarations] = generateDtsBundle([
            {
              filePath: file,
              libraries: {
                inlinedLibraries: [
                  "highlight.js",
                  "mermaid",
                  "dompurify",
                  "@types/trusted-types",
                ],
              },
              output: { noBanner: true, exportReferencedTypes: false },
            },
          ]);
          writeFileSync(file, declarations);
        },
      },
    ],
  },
];
