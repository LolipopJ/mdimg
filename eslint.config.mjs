import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      ".*/**",
      "docs/**",
      "lib/**",
      "node_modules/**",
      "site/dist/**",
      "template/css/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.ts"],
    ignores: ["site/src/**"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["site/src/**"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["test/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        requirePackage: "readonly",
        importPackage: "readonly",
      },
    },
  },
  {
    files: ["bin/mdimg.js", "test/**", "jest*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  eslintPluginPrettierRecommended,
);
