import fs from "fs";
import path from "path";

import type { IExtension, IExtensionInjectResult } from "../interfaces";

export const createMathJaxExtension = (
  config: boolean | Record<string, unknown>,
): IExtension => ({
  name: "mathJax",

  inject(): IExtensionInjectResult {
    const mathJaxOptions = Object.assign({}, config === true ? {} : config);

    const mathJaxScriptText = fs.readFileSync(
      path.resolve(`${__dirname}/../static/mathjax@4.1.1/tex-mml-chtml.min.js`),
    );

    return {
      head: `
<!-- MathJax options -->
<script>
  MathJax = ${JSON.stringify(mathJaxOptions)}
</script>
`,
      body: `
<!-- MathJax -->
<script>${mathJaxScriptText}</script>
`,
    };
  },
});
