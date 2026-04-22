import fs from "fs";
import path from "path";

import type {
  IExtension,
  IExtensionContext,
  IExtensionInjectResult,
} from "../interfaces";

export const createMermaidExtension = (
  config: boolean | Record<string, unknown>,
): IExtension => ({
  name: "mermaid",

  inject({ theme }: IExtensionContext): IExtensionInjectResult {
    const mermaidOptions = Object.assign(
      {
        startOnLoad: true,
        theme: theme === "dark" ? "dark" : undefined,
      },
      config === true ? {} : config,
    );

    const mermaidScriptText = fs.readFileSync(
      path.resolve(
        `${__dirname}/../static/mermaid@11.14.0/dist/mermaid.min.min.js`,
      ),
    );

    return {
      body: `
<!-- Mermaid -->
<script>
  ${mermaidScriptText}
  mermaid.initialize(${JSON.stringify(mermaidOptions)});
  mermaid.contentLoaded();
</script>
`,
    };
  },
});
