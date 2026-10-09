#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { Command, CommanderError, Option } = require("commander");
const { mdimg } = require("../lib/mdimg.js");

const pkg = require("../package.json");

const program = new Command();

program
  .exitOverride()
  .name(pkg.name)
  .usage("-i <input filename> [-o <output file>] [-w <width>]")
  .addOption(
    new Option(
      "-t, --text <input text>",
      "Input Markdown or HTML text directly",
    ),
  )
  .addOption(
    new Option(
      "-i, --input <input filename>",
      "Read Markdown or HTML text from a file. Option -t or --text will be ignored",
    ),
  )
  .addOption(
    new Option(
      "-o, --output <output filename>",
      "Output binary image filename. File type can be one of 'jpeg', 'png' or 'webp'. Available when option --encoding is 'binary'",
    ),
  )
  .addOption(
    new Option(
      "--type <image type>",
      "The file type of the image. Type will be inferred from option --output if provided",
    ),
  )
  .addOption(
    new Option("-w, --width <pixel>", "The width in pixel of output image"),
  )
  .addOption(
    new Option(
      "--height <pixel>",
      "The min-height in pixel of output image (>= 100)",
    ),
  )
  .addOption(
    new Option(
      "-e, --encoding <encoding type>",
      "The encoding of output image. If 'base64' or 'blob' is specified, the result string or blob will be output via stdout",
    ),
  )
  .addOption(
    new Option(
      "-q, --quality <image quality>",
      "The quality of the image, between 0-100. Not applicable to 'png' image.",
    ),
  )
  .addOption(
    new Option(
      "--template <template name>",
      "Specify a template. You can find them in template folder. HTML and CSS templates will try to use the same name",
    ),
  )
  .addOption(
    new Option(
      "--html <template name>",
      "Specify a HTML template. You can find them in template/html folder. Option --template will be ignored",
    ),
  )
  .addOption(
    new Option(
      "--htmlText <html text>",
      "Use the input text as a custom HTML template. Option --html will be ignored",
    ),
  )
  .addOption(
    new Option(
      "--css <template name>",
      "Specify a CSS template. You can find them in template/css folder. Option --template will be ignored",
    ),
  )
  .addOption(
    new Option(
      "--cssText <css text>",
      "Use the input text as a custom CSS template. Option --css will be ignored",
    ),
  )
  .addOption(
    new Option(
      "--theme <color theme>",
      "Rendering color theme, will impact styles of code block and so on",
    ),
  )
  .addOption(
    new Option(
      "--extensions <enabled>",
      "Whether to enable extensions. Can be 'true', 'false', or a JSON object to configure individual extensions (highlightJs, mathJax, mermaid)",
    ),
  )
  .addOption(
    new Option(
      "--debug",
      "Whether to keep temporary HTML file after rendering",
    ),
  )
  .version(pkg.version);

program.addHelpText(
  "after",
  `

Examples:
  $ mdimg -t '# Hello World!' -o output/hello_world.jpeg
  $ mdimg -i README.md -o output/image.png -w 1000 --css github
`,
);

function parseExtensions(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      `Invalid --extensions value: "${value}". Expected 'true', 'false', or a JSON object.`,
    );
  }
}

function parseNumber(value) {
  if (value === undefined) return undefined;
  // Number("") and Number(" ") are zero, not valid numeric CLI arguments.
  return value.trim() === "" ? NaN : Number(value);
}

async function main() {
  program.parse();
  const {
    text,
    input,
    output,
    type,
    quality,
    encoding,
    width,
    height,
    template,
    htmlText,
    html,
    cssText,
    css,
    extensions,
    theme,
    debug,
  } = program.opts();

  // mdimg normalizes and validates both CLI and library options in one place.
  const res = await mdimg({
    inputText: text,
    inputFilename: input,
    outputFilename: output,
    type,
    width: parseNumber(width),
    height: parseNumber(height),
    encoding,
    quality: parseNumber(quality),
    htmlText,
    cssText,
    htmlTemplate: html ?? template,
    cssTemplate: css ?? template,
    extensions: parseExtensions(extensions),
    theme,
    log: encoding === undefined || encoding === "binary",
    debug,
  });
  if (encoding === "base64" || encoding === "blob") {
    process.stdout.write(res.data);
  }
}

main().catch((err) => {
  if (err instanceof CommanderError) {
    // Commander already wrote help/version to stdout or diagnostics to stderr.
    if (err.exitCode !== 0) process.exitCode = 1;
    return;
  }
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
