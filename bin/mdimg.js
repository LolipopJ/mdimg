#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { Command, Option } = require("commander");
const { convert2img } = require("../lib/mdimg.js");

const pkg = require("../package.json");

const _encodingTypes = ["base64", "binary"];
const _outputFileTypes = ["jpeg", "png", "webp"];

const program = new Command();

program
  .name(pkg.name)
  .usage("-i <input file> [-o <output file>] [-w <width>]")
  .addOption(
    new Option(
      "-t, --text <input text>",
      "Input Markdown or HTML text directly. Not applicable when option --input is specified",
    ),
  )
  .addOption(
    new Option(
      "-i, --input <input file>",
      "Read Markdown or HTML text from a file",
    ),
  )
  .addOption(
    new Option(
      "-o, --output <output file>",
      "Output binary image filename. File type can be one of 'jpeg', 'png' or 'webp' Available when option --encoding is 'binary'",
    ),
  )
  .addOption(
    new Option(
      "--type <image type>",
      "The file type of the image. Type can be one of 'jpeg', 'png' or 'webp', defaults to 'png'. Type will be inferred from option --output if available",
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
      "The encoding of output image. If 'base64' is specified, mdimg will print the BASE64 encoded string to the console",
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
      "--template <template>",
      "Specify a template. You can find them in template folder. HTML and CSS templates will try to use the same name",
    ).default("default"),
  )
  .addOption(
    new Option(
      "--htmlText <html text>",
      "Use the input text as a custom HTML template",
    ),
  )
  .addOption(
    new Option(
      "--html <template>",
      "Specify a HTML template. You can find them in template/html folder. Option --template will be overridden",
    ),
  )
  .addOption(
    new Option(
      "--cssText <css text>",
      "Use the input text as a custom CSS template",
    ),
  )
  .addOption(
    new Option(
      "--css <template>",
      "Specify a CSS template. You can find them in template/css folder. Option --template will be overridden",
    ),
  )
  .version(pkg.version);

program.addHelpText(
  "after",
  `

Example call:
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

convert2img({
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
  log: true,
});
