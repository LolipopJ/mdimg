import type {
  IExtension,
  IExtensionInjectResult,
  IExtensionOptions,
} from "../interfaces";
import {
  inlineScript,
  readAsset,
  readAssetTable,
  serializeForScript,
} from "../utils/assets";

export const createMathJaxExtension = (
  config: IExtensionOptions["mathJax"],
): IExtension => ({
  name: "mathJax",

  inject(): IExtensionInjectResult {
    const mathJaxOptions = typeof config === "boolean" ? {} : config;
    const resources = readAssetTable(["mathjax/", "mathjax-newcm/"]);

    return {
      body: `${inlineScript(readAsset("mathjax-adapter.js"))}
${inlineScript(`globalThis.__mdimgTasks.push({
  name: "mathJax",
  run: () => globalThis.__mdimgMathJax(${serializeForScript(mathJaxOptions)}, ${serializeForScript(resources)})
});`)}`,
    };
  },
});
