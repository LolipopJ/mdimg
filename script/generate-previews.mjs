#!/usr/bin/env node

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Command, CommanderError, InvalidArgumentError } from "commander";

import { mdimg } from "../lib/mdimg.js";

const cssDir = resolve(import.meta.dirname, "../template/css");
const defaultOptions = {
  inputFilename: resolve(import.meta.dirname, "../test/static/test.md"),
  htmlTemplate: "default",
  theme: "light",
  width: 1000,
  extensions: {
    mathJax: {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
      },
    },
  },
};
const styleOptions = {
  binance: { theme: "dark" },
  "bmw-m": { theme: "dark" },
  claude: { theme: "dark" },
  githubDark: { theme: "dark" },
  midnight: { theme: "dark" },
  playstation: { theme: "dark" },
  replicate: { theme: "dark" },
  sentry: { theme: "dark" },
  spacex: { theme: "dark" },
  vercel: { theme: "dark" },
  words: {
    inputFilename: resolve(
      import.meta.dirname,
      "../test/static/test-template-words.md",
    ),
    htmlTemplate: "words",
    width: 1200,
  },
  ["x.ai"]: { theme: "dark" },
};

export async function generatePreviews({
  styles = [],
  outputDir = resolve(import.meta.dirname, "../docs", process.platform),
  concurrency = 3,
  debug = false,
  options = {},
} = {}) {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive safe integer.");
  }
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("Preview options must be a JSON object.");
  }

  const availableStyles = readdirSync(cssDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => entry.name.slice(0, -4))
    .sort();
  const selectedStyles = styles.length ? [...new Set(styles)] : availableStyles;
  for (const name of selectedStyles) {
    if (!availableStyles.includes(name)) {
      throw new Error(
        `Unknown style: ${name}. Available: ${availableStyles.join(", ")}`,
      );
    }
  }

  const queue = selectedStyles.values();
  const workers = Array.from(
    { length: Math.min(concurrency, selectedStyles.length) },
    async () => {
      for (const name of queue) {
        const renderOptions = {
          ...defaultOptions,
          ...styleOptions[name],
          debug,
          ...options,
        };
        if (
          Object.hasOwn(options, "inputText") &&
          !Object.hasOwn(options, "inputFilename")
        ) {
          delete renderOptions.inputFilename;
        }
        const outputFilename = resolve(
          outputDir,
          `${name}.${renderOptions.type ?? "png"}`,
        );
        await mdimg({
          ...renderOptions,
          cssTemplate: resolve(cssDir, `${name}.css`),
          encoding: "binary",
          outputFilename,
        });
        process.stdout.write(`Generated ${outputFilename}\n`);
      }
    },
  );
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}

async function main() {
  const program = new Command()
    .name("generate-previews")
    .description("Generate previews for styles in template/css")
    .argument("[styles...]", "Style names; omit to generate every CSS style")
    .option(
      "-o, --output <directory>",
      "Output directory (default: docs/<platform>)",
    )
    .option(
      "-j, --concurrency <number>",
      "Maximum concurrent conversions",
      Number,
      3,
    )
    .option("--debug", "Whether to keep temporary HTML file after rendering")
    .option(
      "--options <json>",
      "Override mdimg rendering options with a JSON object",
      (value) => {
        try {
          const options = JSON.parse(value);
          if (
            options !== null &&
            typeof options === "object" &&
            !Array.isArray(options)
          )
            return options;
        } catch {
          // Report both malformed JSON and non-object values as argument errors.
        }
        throw new InvalidArgumentError("Expected a JSON object.");
      },
    )
    .exitOverride();
  program.parse();
  const { output, concurrency, debug, options } = program.opts();
  await generatePreviews({
    styles: program.args,
    outputDir: output,
    concurrency,
    debug,
    options,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode;
      return;
    }
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
