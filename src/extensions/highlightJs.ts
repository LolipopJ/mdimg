import type {
  IExtension,
  IExtensionContext,
  IExtensionInjectResult,
  IHighlightJsTheme,
} from "../interfaces";
import { inlineScript, readAsset, serializeForScript } from "../utils/assets";

export const createHighlightJsExtension = (
  config: boolean | { theme?: IHighlightJsTheme; [key: string]: unknown },
): IExtension => ({
  name: "highlightJs",

  inject({ theme }: IExtensionContext): IExtensionInjectResult {
    const defaultTheme: IHighlightJsTheme =
      theme === "dark" ? "atom-one-dark" : "atom-one-light";
    const highlightJsOptions = Object.assign(
      { theme: defaultTheme },
      config === true ? {} : config,
    );

    const selectedTheme = highlightJsOptions.theme;
    if (!/^(base16\/)?[a-z0-9][a-z0-9-]*$/.test(selectedTheme)) {
      throw new Error(`highlightJs: unknown theme ${selectedTheme}`);
    }
    let themeText: string;
    try {
      themeText = readAsset(`highlight/styles/${selectedTheme}.css`);
    } catch (error) {
      throw new Error(`highlightJs: unknown theme ${selectedTheme}`, {
        cause: error,
      });
    }
    const highlightScriptText = readAsset("highlight.js");
    const options: Record<string, unknown> = { ...highlightJsOptions };
    delete options.theme;

    return {
      head: `
<!-- highlight.js styles -->
<style>${themeText}</style>
`,
      body: `
<!-- highlight.js -->
${inlineScript(highlightScriptText)}
${inlineScript(`
  window.__mdimgTasks.push({ name: "highlightJs", run: () => {
    hljs.configure(${serializeForScript(options)});
    document.querySelectorAll('pre code').forEach(code => hljs.highlightElement(code));
  }});
`)}
`,
    };
  },
});
