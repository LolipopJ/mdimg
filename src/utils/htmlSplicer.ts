import { load } from "cheerio";
import fs from "fs";
import path from "path";

import type { IConvertOptions, IExtension } from "../interfaces";
import { inlineScript, readAsset } from "./assets";

const spliceHtml = async ({
  renderedHtml,
  htmlText,
  cssText,
  htmlTemplate = "default",
  cssTemplate = "default",
  resolvedExtensions = [],
  log = false,
  baseUrl,
}: Pick<
  IConvertOptions,
  "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "log"
> & {
  /** HTML document parsed by Markdown source */
  renderedHtml: string;
  /** Fully resolved extension list (built-ins + plugin overrides) from PluginManager */
  resolvedExtensions?: IExtension[];
  /** Preserve the source directory for relative resources when HTML is relocated. */
  baseUrl?: string;
}): Promise<string> => {
  let _htmlSource = htmlText;

  if (_htmlSource === undefined) {
    let _htmlPath = path.resolve(
      htmlTemplate.endsWith(".html")
        ? htmlTemplate
        : `${__dirname}/../template/html/${htmlTemplate}.html`,
    );

    try {
      fs.accessSync(_htmlPath, fs.constants.R_OK);
    } catch (err) {
      if (log) {
        process.stderr.write(
          `Warning: HTML template ${_htmlPath} is not found or unreadable. Use default HTML template.\n${err}\n`,
        );
      }
      _htmlPath = path.resolve(`${__dirname}/../template/html/default.html`);
    }

    _htmlSource = fs.readFileSync(_htmlPath).toString();
  }

  let _cssPath = path.resolve(
    cssTemplate.endsWith(".css")
      ? cssTemplate
      : `${__dirname}/../template/css/${cssTemplate}.css`,
  );

  try {
    fs.accessSync(_cssPath, fs.constants.R_OK);
  } catch (err) {
    if (log) {
      process.stderr.write(
        `Warning: CSS template ${_cssPath} is not found or unreadable. Use default CSS template.\n${err}\n`,
      );
    }
    _cssPath = path.resolve(`${__dirname}/../template/css/default.css`);
  }

  const _cssSource = fs.readFileSync(_cssPath).toString();

  const $ = load(`<!DOCTYPE html>\n${_htmlSource}`);
  if (baseUrl && !$("base[href]").length) {
    $("head").prepend($("<base>").attr("href", baseUrl));
  }
  $("head").prepend(inlineScript(readAsset("page-ready.js")));
  $("head").append(`
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mdimg rendering preview</title>
<style>
${_cssSource}
</style>
`);
  $(".markdown-body").html(renderedHtml);

  const context = { cssTemplate };

  for (const ext of resolvedExtensions) {
    const result = await ext.inject(context);
    if (result.head) $("head").append(result.head);
    if (result.body) $("body").append(result.body);
  }

  if (cssText) $("head").append(`<style>\n${cssText}\n</style>`);

  return $.html();
};

export { spliceHtml };
