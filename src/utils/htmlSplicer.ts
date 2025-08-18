import cheerio from "cheerio";
import fs from "fs";
import path from "path";

import type { IConvertOptions, IExtensionOptions } from "../interfaces";

const spliceHtml = ({
  renderedHtml,
  htmlText,
  cssText,
  htmlTemplate = "default",
  cssTemplate = "default",
  theme = "light",
  extensions = true,
  log = false,
}: Pick<
  IConvertOptions,
  | "htmlText"
  | "cssText"
  | "htmlTemplate"
  | "cssTemplate"
  | "theme"
  | "extensions"
  | "log"
> & {
  /** HTML document parsed by Markdown source */
  renderedHtml: string;
}) => {
  let _htmlSource = htmlText;
  let _cssSource = cssText;

  if (!_htmlSource) {
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

  if (!_cssSource) {
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

    _cssSource = fs.readFileSync(_cssPath).toString();
  }

  const $ = cheerio.load(_htmlSource);
  $("head").append(`
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mdimg rendering preview</title>
<style>
${_cssSource}
</style>
`);
  $(".markdown-body").html(renderedHtml);

  if (extensions !== false) {
    const _extensions = Object.assign(
      { highlightJs: true, mathJax: true, mermaid: true } as IExtensionOptions,
      extensions,
    );
    const { highlightJs, mathJax, mermaid } = _extensions;

    if (highlightJs !== false) {
      const highlightJsOptions = Object.assign(
        {
          theme: `atom-one-${theme}`,
        },
        highlightJs,
      );

      const themeText = fs.readFileSync(
        path.resolve(
          `${__dirname}/../static/highlightjs/cdn-release@11/build/styles/${highlightJsOptions.theme}.min.css`,
        ),
      );
      const highlightScriptText = fs.readFileSync(
        path.resolve(
          `${__dirname}/../static/highlightjs/cdn-release@11/build/highlight.min.js`,
        ),
      );

      $("head").append(`
<!-- highlight.js styles -->
<style>${themeText}</style>
`);

      $("body").append(`
<!-- highlight.js -->
<script>${highlightScriptText}</script>
<script>
  hljs.configure(${JSON.stringify(highlightJsOptions)});
  hljs.highlightAll();
</script>
`);
    }

    if (mathJax !== false) {
      const mathJaxOptions = Object.assign({}, mathJax);

      const mathJaxScriptText = fs.readFileSync(
        path.resolve(`${__dirname}/../static/mathjax@3/es5/tex-mml-chtml.js`),
      );

      $("head").append(`
<!-- MathJax options -->
<script>
  MathJax = ${JSON.stringify(mathJaxOptions)}
</script>
`);

      $("body").append(`
<!-- MathJax -->
<script>${mathJaxScriptText}</script>
`);
    }

    if (mermaid !== false) {
      const mermaidOptions = Object.assign(
        {
          startOnLoad: true,
          theme: theme === "dark" ? "dark" : undefined,
        },
        mermaid,
      );

      $("body").append(`
<!-- Mermaid -->
<script type="module">
  import mermaid from 'https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize(${JSON.stringify(mermaidOptions)});
</script>
`);
    }
  }

  return $.html();
};

export { spliceHtml };
