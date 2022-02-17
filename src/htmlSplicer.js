const { join } = require('path')
const { readFileSync } = require('fs')
const cheerio = require('cheerio')

function spliceHtml(mdHtml, htmlTemplate, cssTemplate) {
  const htmlPath = join('src/template/html', `${htmlTemplate}.html`)
  const cssPath = join('src/template/css', `${cssTemplate}.css`)

  const htmlSource = readFileSync(htmlPath)
  const cssSource = readFileSync(cssPath)

  const $ = cheerio.load(htmlSource)
  $('.markdown-body').html(mdHtml)

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mdimg</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css">
    <style>
      ${cssSource}
    </style>
  </head>
  <body>
    ${$.html()}
  </body>
  </html>`

  return html
}

module.exports = { spliceHtml }
