const { join } = require('path')
const { readFileSync } = require('fs')
const cheerio = require('cheerio')

function spliceHtml(mdHtml, htmlTemplate, cssTemplate) {
  const _htmlPath = join('src/template/html', `${htmlTemplate}.html`)
  const _cssPath = join('src/template/css', `${cssTemplate}.css`)

  const _htmlSource = readFileSync(_htmlPath)
  const _cssSource = readFileSync(_cssPath)

  const $ = cheerio.load(_htmlSource)
  $('.markdown-body').html(mdHtml)

  const _html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mdimg</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css">
    <style>
      ${_cssSource}
    </style>
  </head>
  <body>
    ${$.html()}
  </body>
  </html>`

  return _html
}

module.exports = { spliceHtml }
