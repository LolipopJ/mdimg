const { resolve, dirname } = require('path')
const {
  existsSync,
  statSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} = require('fs')
const puppeteer = require('puppeteer')

const { parseMarkdown } = require('./mdParser')
const { spliceHtml } = require('./htmlSplicer')

async function convert2img({
  mdText,
  mdFile,
  htmlTemplate = 'default',
  cssTemplate = 'default',
  width = 800,
  height = 600,
  encoding = 'binary',
  outputFileName,
} = {}) {
  let input = mdText
  let output
  const result = {}

  if (mdFile) {
    const inputFilePath = resolve(mdFile)
    if (!existsSync(inputFilePath)) {
      // Input is not exist
      throw new Error('Input file is not exists.')
    } else {
      if (!statSync(inputFilePath).isFile()) {
        // Input is not a file
        throw new Error('Input is not a file.')
      } else {
        // Read text from input file
        input = readFileSync(inputFilePath, { encoding: 'utf-8' })
      }
    }
  } else if (!mdText) {
    // There is no input text or file
    throw new Error('You must provide a text or a file to be converted.')
  }

  const encodingType = ['base64', 'binary']
  if (!encodingType.includes(encoding)) {
    // Params encoding is not valid
    throw new Error(
      `Encoding ${encoding} is not supported. Valid values: 'base64' and 'binary'.`
    )
  }

  if (encoding === 'binary') {
    if (!outputFileName) {
      // Set default output file name
      const now = new Date()
      const outputFileNameSuffix = `${now.getFullYear()}_${
        now.getMonth() + 1
      }_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}_${now.getMilliseconds()}`
      output = resolve('mdimg_output', `mdimg_${outputFileNameSuffix}.png`)
    } else {
      output = resolve(outputFileName)
    }
  }

  // Parse markdown text to HTML
  const html = spliceHtml(parseMarkdown(input), htmlTemplate, cssTemplate)
  result.html = html

  // Launch headless browser to load HTML
  const browser = await puppeteer.launch({
    defaultViewport: {
      width,
      height,
    },
    args: [`--window-size=${width},${height}`],
  })
  const page = await browser.newPage()
  await page.setContent(html, {
    waitUntil: 'networkidle0',
  })

  const body = await page.$('#mdimg-body')
  if (body) {
    if (encoding === 'binary') {
      // Create empty output file
      if (!createEmptyFile(output)) {
        throw new Error(`Create new file ${output} failed.`)
      }

      // Generate output image
      await body.screenshot({
        path: output,
        encoding,
      })
      result.data = output

      await browser.close()
      return result
    } else if (encoding === 'base64') {
      const outputBase64String = await body.screenshot({
        encoding,
      })
      result.data = outputBase64String

      await browser.close()
      return result
    }
  } else {
    await browser.close()

    // HTML template is not valid
    throw new Error(
      `Missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.`
    )
  }
}

function createEmptyFile(fileName) {
  const filePath = dirname(fileName)

  try {
    mkdirSync(filePath, { recursive: true })

    writeFileSync(fileName, '')

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = { convert2img }
