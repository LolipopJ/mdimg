const path = require('path')
const puppeteer = require('puppeteer')
import { cwd } from 'process'

import { parseMarkdown } from './mdParser'
import { spliceHtml } from './htmlSplicer'

export async function mdimg(
  mdText = '# Hello\nWorld!',
  {
    htmlTemplate = 'default',
    cssTemplate = 'default',
    width = 600,
    output = 'output/screenshot.png',
  } = {}
) {
  const html = spliceHtml(parseMarkdown(mdText), htmlTemplate, cssTemplate)

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html, {
    waitUntil: 'networkidle0',
  })
  const body = await page.$('#mdimg-body')
  if (body) {
    await body.screenshot({
      path: path.join(cwd(), output),
    })
  } else {
    console.error('Missing HTML element with id: mdimg-body')
  }

  await browser.close()
}
