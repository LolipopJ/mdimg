#!/usr/bin/env node

const { basename } = require('path')
const { Command, Option } = require('commander')
const { convert2img } = require('../lib/mdimg.js')

const pkg = require('../package.json')

const encodingType = ['base64', 'binary']
const outputFileType = ['jpeg', 'png', 'webp']

const program = new Command()

program
  .name(pkg.name)
  .version(pkg.version)
  .usage('-i <input file> [-o <output file>] [-w <width>]')
  .addOption(
    new Option(
      '-t, --text <input text>',
      'Input Markdown or HTML text directly. This option has no effect if input file is specified'
    )
  )
  .addOption(
    new Option(
      '-i, --input <input file>',
      'Read from a file instead of typing directly'
    )
  )
  .addOption(
    new Option(
      '-o, --output <output file>',
      "Output binary image file storage address. File type must be one of 'jpeg', 'png' or 'webp', defaults to 'png'. Available when encoding option is 'binary'"
    )
  )
  .addOption(
    new Option('-e, --encoding <type>', 'The encoding of the image')
      .default('binary')
      .choices(encodingType)
  )
  .addOption(
    new Option('-w, --width <width>', 'The width of the image').default(800)
  )
  .addOption(
    new Option(
      '--template <template>',
      'Specify a template. You can find them in src/template folder'
    ).default('default')
  )

program.addHelpText(
  'after',
  `

Example call:
  $ mdimg -i input.md -o output/image.png
  $ mdimg -t '# Hello World!' -o output/hello_world.jpeg -w 600
`
)

program.parse()

const { text, input, output, encoding, width, template } = program.opts()

;(async () => {
  if (!text && !input) {
    console.error(
      'You must provide input text or file! Help me:\n',
      '$ mdimg -h'
    )
    return
  }

  let outputFileName = output
  if (output) {
    const _outputFileName = basename(output)
    const _outputFileNameArr = _outputFileName.split('.')
    if (_outputFileNameArr.length <= 1) {
      // Output file type is not specified
      outputFileName = output + '.png'
    } else if (
      !outputFileType.includes(
        _outputFileNameArr[_outputFileNameArr.length - 1]
      )
    ) {
      // Output file type is wrongly specified
      console.error("Output file type must be one of 'jpeg', 'png' or 'webp'")
      return
    }
  }

  const convertRes = await convert2img({
    mdText: text,
    mdFile: input,
    htmlTemplate: template,
    cssTemplate: template,
    width: Number(width),
    encoding: encoding,
    outputFileName: outputFileName,
  })

  if (encoding === 'binary') {
    console.log(`Convert to image successfully!\nFile: ${convertRes.data}`)
  } else if (encoding === 'base64') {
    console.log(`Convert to base64 string successfully!\n${convertRes.data}`)
  }
})()
