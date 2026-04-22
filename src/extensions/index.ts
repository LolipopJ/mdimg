import type { IExtension, IExtensionOptions } from "../interfaces";
import { createHighlightJsExtension } from "./highlightJs";
import { createMathJaxExtension } from "./mathJax";
import { createMermaidExtension } from "./mermaid";

export { createHighlightJsExtension } from "./highlightJs";
export { createMathJaxExtension } from "./mathJax";
export { createMermaidExtension } from "./mermaid";

/**
 * Instantiate the built-in extensions based on the `extensions` option value.
 * Returns an empty array when `extensions` is `false`.
 */
export const createBuiltinExtensions = (
  extensions: boolean | IExtensionOptions,
): IExtension[] => {
  if (extensions === false) return [];

  const opts = Object.assign(
    { highlightJs: true, mathJax: true, mermaid: true } as IExtensionOptions,
    extensions === true ? {} : extensions,
  );

  const result: IExtension[] = [];

  if (opts.highlightJs !== false) {
    result.push(createHighlightJsExtension(opts.highlightJs ?? true));
  }
  if (opts.mathJax !== false) {
    result.push(createMathJaxExtension(opts.mathJax ?? true));
  }
  if (opts.mermaid !== false) {
    result.push(createMermaidExtension(opts.mermaid ?? true));
  }

  return result;
};
