import { rmSync } from "node:fs";

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
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
    banner: `<%= pkg.name %> - convert markdown to image\
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
    },
    external: externalModules,
    plugins: [
      {
        name: "clean-output",
        buildStart() {
          rmSync("lib", { recursive: true, force: true });
        },
      },
      ...pluginsArray,
    ],
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
        name: "esm-declarations",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "mdimg.d.mts",
            source: 'export * from "./mdimg.js";\n',
          });
        },
      },
    ],
  },
];
