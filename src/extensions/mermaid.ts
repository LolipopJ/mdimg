import type {
  IExtension,
  IExtensionContext,
  IExtensionInjectResult,
} from "../interfaces";
import { inlineScript, readAsset, serializeForScript } from "../utils/assets";

export const createMermaidExtension = (
  config: boolean | Record<string, unknown>,
): IExtension => ({
  name: "mermaid",

  inject({ theme }: IExtensionContext): IExtensionInjectResult {
    const mermaidOptions = Object.assign(
      {
        theme: theme === "dark" ? "dark" : undefined,
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
