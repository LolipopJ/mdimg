#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { Command, Option } = require("commander");
const { mdimg } = require("../lib/mdimg.js");

const pkg = require("../package.json");

const _encodingTypes = ["base64", "binary", "blob"];
const _outputFileTypes = ["jpeg", "png", "webp"];

const program = new Command();

program
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
    )
      .default("png")
      .choices(_outputFileTypes),
  )
  .addOption(
    new Option("-w, --width <width>", "The width of output image").default(800),
  )
  .addOption(
    new Option(
      "-e, --encoding <encoding type>",
      "The encoding of output image. If 'base64' or 'blob' is specified, the result string or blob will be output via stdout",
    )
      .default("binary")
      .choices(_encodingTypes),
  )
  .addOption(
    new Option(
      "-q, --quality <image quality>",
      "The quality of the image, between 0-100. Not applicable to 'png' image.",
    ).default(100),
  )
  .addOption(
    new Option(
      "--template <template name>",
      "Specify a template. You can find them in template folder. HTML and CSS templates will try to use the same name",
    ).default("default"),
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
  .version(pkg.version);

program.addHelpText(
  "after",
  `

Examples:
  $ mdimg -t '# Hello World!' -o output/hello_world.jpeg
  $ mdimg -i README.md -o output/image.png -w 1000 --css github
`,
);

program.parse();

const {
  text,
  input,
  output,
  type,
  quality,
  encoding,
  width,
  template,
  htmlText,
  html,
  cssText,
  css,
} = program.opts();

if (!text && !input) {
  program.help();
  process.exit(1);
}

mdimg({
  inputText: text,
  inputFilename: input,
  outputFilename: output,
  type,
  width: Number(width),
  encoding,
  quality: Number(quality),
  htmlText,
  cssText,
  htmlTemplate: html || template,
  cssTemplate: css || template,
  log: encoding === "binary",
})
  .then((res) => {
    if (encoding === "base64" || encoding === "blob")
      process.stdout.write(res.data);
  })
  .catch((err) => {
    process.stderr.write(String(err));
  });
