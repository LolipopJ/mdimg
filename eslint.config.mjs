import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import babelParser from "@babel/eslint-parser";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      ".*/",
      "docs/",
      "lib/",
      "node_modules/",
      "template/",
      "test/**/*.test.js",
    ],
  },
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: babelParser,
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
);
