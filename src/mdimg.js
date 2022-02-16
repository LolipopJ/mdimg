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
  outputPath = 'output',
  outputFileName,
} = {}) {
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
        mdText = fs.readFileSync(inputFilePath, { encoding: 'utf-8' })
      }
    }
  } else if (!mdText) {
    throw new Error('You must provide a text or a file to be converted.')
  }

  if (!outputFileName) {
    const now = new Date()
    const outputFileNameSuffix = `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`
    outputFileName = `MarkdownImage-${outputFileNameSuffix}.png`
  }

  const html = spliceHtml(parseMarkdown(mdText), htmlTemplate, cssTemplate)
  console.log('HTML Document:\n', html)

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
    const exportPath = path.resolve(outputPath)
    const exportFile = path.join(exportPath, outputFileName)
    if (!createEmptyFile(exportPath, outputFileName)) {
      throw new Error(`Create ${exportFile} failed.`)
    }

    await body.screenshot({
      path: exportFile,
    })

    console.log(`Convert to image successfully!\nFile: ${exportFile}`)
  } else {
    throw new Error('Missing HTML element with id: mdimg-body')
  }

  await browser.close()
  return true
}

function createEmptyFile(filePath, fileName) {
  try {
    fs.mkdirSync(filePath, { recursive: true })

    fs.writeFileSync(path.join(filePath, fileName), '')

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
