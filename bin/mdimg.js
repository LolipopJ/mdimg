#!/usr/bin/env node

const { Command, Option } = require('commander')
const { convert2img } = require('../lib/mdimg.js')

const pkg = require('../package.json')

const encodingType = ['base64', 'binary']

const program = new Command()

program
  .name(pkg.name)
  .version(pkg.version)
  .usage('-i <input file> [-o <output file>] [-w <width>]')
  .addOption(
    new Option(
      '-t, --text <input text>',
      'Input Markdown or HTML text directly. This option has no effect if option input is specified'
    )
  )
  .addOption(
    new Option(
      '-i, --input <input file>',
      'Read Markdown or HTML text from a file'
    )
  )
  .addOption(
    new Option(
      '-o, --output <output file>',
      "Output binary image filename. File type must be one of 'jpeg', 'png' or 'webp', defaults to 'png'. Available when option encoding is 'binary'"
    )
  )
  .addOption(
    new Option('-e, --encoding <type>', 'The encoding of output image')
      .default('binary')
      .choices(encodingType)
  )
  .addOption(
    new Option('-w, --width <width>', 'The width of output image').default(800)
  )
  .addOption(
    new Option(
      '--template <template>',
      'Specify a template. You can find them in template folder. HTML and CSS templates will try to use the same name'
    ).default('default')
  )
  .addOption(
    new Option(
      '--html <template>',
      'Specify a HTML template. You can find them in template/html folder. Option template will be overrided'
    )
  )
  .addOption(
    new Option(
      '--css <template>',
      'Specify a CSS template. You can find them in template/css folder. Option template will be overrided'
    )
  )

program.addHelpText(
  'after',
  `

Example call:
  $ mdimg -t '# Hello World!' -o output/hello_world.jpeg
  $ mdimg -i README.md -o output/image.png -w 1000 --css github
`
)

program.parse()

const { text, input, output, encoding, width, template, html, css } =
  program.opts()

if (!text && !input) {
  program.help()
  process.exit(1)
}

convert2img({
  mdText: text,
  mdFile: input,
  htmlTemplate: html || template,
  cssTemplate: css || template,
  width: Number(width),
  encoding: encoding,
  outputFilename: output,
  log: true,
})
