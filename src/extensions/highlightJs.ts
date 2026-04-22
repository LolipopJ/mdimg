import fs from "fs";
import path from "path";

import type {
  IExtension,
  IExtensionContext,
  IExtensionInjectResult,
} from "../interfaces";

export const createHighlightJsExtension = (
  config: boolean | { theme?: string; [key: string]: unknown },
): IExtension => ({
  name: "highlightJs",

  inject({ theme }: IExtensionContext): IExtensionInjectResult {
    const highlightJsOptions = Object.assign(
      { theme: `atom-one-${theme}` },
      config === true ? {} : config,
    );

    const themeText = fs.readFileSync(
      path.resolve(
        `${__dirname}/../static/@highlightjs/cdn-assets@11.11.1/styles/${highlightJsOptions.theme}.min.css`,
      ),
    );
    const highlightScriptText = fs.readFileSync(
      path.resolve(
        `${__dirname}/../static/@highlightjs/cdn-assets@11.11.1/highlight.min.min.js`,
      ),
    );

    return {
      head: `
<!-- highlight.js styles -->
<style>${themeText}</style>
`,
      body: `
<!-- highlight.js -->
<script>${highlightScriptText}</script>
<script>
  hljs.configure(${JSON.stringify(highlightJsOptions)});
  hljs.highlightAll();
</script>
`,
    };
  },
});
