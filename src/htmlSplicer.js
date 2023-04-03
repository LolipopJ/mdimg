const { resolve } = require("path");
const { readFileSync, accessSync, constants } = require("fs");
const cheerio = require("cheerio");

function spliceHtml(mdHtml, htmlTemplate, cssTemplate) {
  let _htmlPath = resolve(
    __dirname,
    "../template/html",
    `${htmlTemplate}.html`
  );
  let _cssPath = resolve(__dirname, "../template/css", `${cssTemplate}.css`);

  try {
    accessSync(_htmlPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `HTML template ${_htmlPath} is not found or unreadable. Use default HTML template.`
    );
    _htmlPath = resolve(__dirname, "../template/html/default.html");
  }
  try {
    accessSync(_cssPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `CSS template ${_htmlPath} is not found or unreadable. Use default CSS template.`
    );
    _cssPath = resolve(__dirname, "../template/css/default.css");
  }

  const _htmlSource = readFileSync(_htmlPath);
  const _cssSource = readFileSync(_cssPath);

  const $ = cheerio.load(_htmlSource);
  $(".markdown-body").html(mdHtml);

  const _html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mdimg</title>
    <style>
      ${_cssSource}
    </style>
  </head>
  <body>
    ${$.html()}
  </body>
  </html>`;

  return _html;
}

module.exports = { spliceHtml };
