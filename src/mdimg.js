const path = require('path')
const fs = require('fs')
const puppeteer = require('puppeteer')

import { parseMarkdown } from './mdParser'
import { spliceHtml } from './htmlSplicer'

export async function convert2img({
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

  if (mdFile) {
    const inputFilePath = path.resolve(mdFile)
    if (!fs.existsSync(inputFilePath)) {
      // Input is not exist
      throw new Error('Input file is not exists.')
    } else {
      if (!fs.statSync(inputFilePath).isFile()) {
        // Input is not a file
        throw new Error('Input is not a file.')
      } else {
        // Read text from input file
        input = fs.readFileSync(inputFilePath, { encoding: 'utf-8' })
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
      output = path.resolve('mdimg_output', `mdimg_${outputFileNameSuffix}.png`)
    } else {
      output = path.resolve(outputFileName)
    }
  }

  // Parse markdown text to HTML
  const html = spliceHtml(parseMarkdown(input), htmlTemplate, cssTemplate)
  console.log('HTML Document:\n', html)

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

      console.log(`Convert to image successfully!\nFile: ${output}`)

      await browser.close()
      return true
    } else if (encoding === 'base64') {
      const outputBase64String = await body.screenshot({
        encoding,
      })

      await browser.close()
      return outputBase64String
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
  const filePath = path.dirname(fileName)

  try {
    fs.mkdirSync(filePath, { recursive: true })

    fs.writeFileSync(fileName, '')

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
