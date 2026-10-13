import type {
  IExtension,
  IExtensionContext,
  IExtensionInjectResult,
  IExtensionOptions,
} from "../interfaces";
import { inlineScript, readAsset, serializeForScript } from "../utils/assets";
import { getDefaultThemes } from "../utils/themeDefaults";

export const createMermaidExtension = (
  config: IExtensionOptions["mermaid"],
): IExtension => ({
  name: "mermaid",

  inject({ cssTemplate }: IExtensionContext): IExtensionInjectResult {
    const mermaidOptions = Object.assign(
      {
        theme: getDefaultThemes(cssTemplate).mermaid,
      },
      config === true ? {} : config,
      { startOnLoad: false },
    );
    const mermaidScriptText = readAsset("mermaid.js");
    const layouts = JSON.parse(readAsset("mermaid-layouts.json"));

    return {
      head: `<style>${readAsset("katex.css")}</style>`,
      body: `
<!-- Mermaid -->
${inlineScript(mermaidScriptText)}
${inlineScript(readAsset("mermaid-adapter.js"))}
${inlineScript(`
  mermaid.startOnLoad = false;
  mermaid.initialize(${serializeForScript(mermaidOptions)});
  window.__mdimgTasks.push({ name: "mermaid", run: () =>
    globalThis.__mdimgMermaid(${serializeForScript(layouts)})
  });
`)}
`,
    };
  },
});
