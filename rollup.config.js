import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import license from "rollup-plugin-license";
import typescript from "rollup-plugin-typescript2";

const externalModules = ["cheerio", "marked", "puppeteer"];

const pluginsArray = [
  license({
    banner: `mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg`,
  }),
  nodeResolve({ preferBuiltins: true }),
  typescript(),
  commonjs(),
  babel({ babelHelpers: "bundled" }),
  terser(),
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
    plugins: pluginsArray,
  },
  {
    input: "src/mdimg.ts",
    output: {
      file: "lib/mdimg.mjs",
      format: "esm",
    },
    external: externalModules,
    plugins: pluginsArray,
  },
];
