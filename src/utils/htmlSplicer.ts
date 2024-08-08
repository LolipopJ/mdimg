import { resolve } from "path";
import { readFileSync, accessSync, constants } from "fs";
import { load } from "cheerio";
import type { IConvertOptions } from "../interfaces";

const spliceHtml = ({
  inputHtml,
  htmlText,
  cssText,
  htmlTemplate,
  cssTemplate,
}: Pick<
  IConvertOptions,
  "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate"
> & {
  inputHtml: string;
}) => {
  let _htmlSource = htmlText;
  let _cssSource = cssText;

  if (!_htmlSource) {
    let _htmlPath = resolve(
      __dirname,
      "../template/html",
      `${htmlTemplate}.html`,
    );

    try {
      accessSync(_htmlPath, constants.R_OK);
    } catch (err) {
      console.warn(
        `HTML template ${_htmlPath} is not found or unreadable. Use default HTML template.\n${err}`,
      );
      _htmlPath = resolve(__dirname, "../template/html/default.html");
    }

    _htmlSource = readFileSync(_htmlPath).toString();
  }

  if (!_cssSource) {
    let _cssPath = resolve(__dirname, "../template/css", `${cssTemplate}.css`);

    try {
      accessSync(_cssPath, constants.R_OK);
    } catch (err) {
      console.warn(
        `CSS template ${_cssPath} is not found or unreadable. Use default CSS template.\n${err}`,
      );
      _cssPath = resolve(__dirname, "../template/css/default.css");
    }

    _cssSource = readFileSync(_cssPath).toString();
  }

  const $ = load(_htmlSource);
  $(".markdown-body").html(inputHtml);

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
};

export { spliceHtml };
