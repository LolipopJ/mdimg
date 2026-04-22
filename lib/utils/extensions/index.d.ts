import type { IExtension, IExtensionOptions } from "../../interfaces";
export { createHighlightJsExtension } from "./highlightJs";
export { createMathJaxExtension } from "./mathJax";
export { createMermaidExtension } from "./mermaid";
/**
 * Instantiate the built-in extensions based on the `extensions` option value.
 * Returns an empty array when `extensions` is `false`.
 */
export declare const createBuiltinExtensions: (extensions: boolean | IExtensionOptions) => IExtension[];
