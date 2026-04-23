import type { IOutputProcessor } from "../interfaces";
/**
 * Built-in output processor that exports the fully rendered HTML document as a
 * plain UTF-8 string — **no Puppeteer browser is launched**.
 *
 * The returned `data` field is the complete HTML document (identical to
 * `IConvertResponse.html`). When `outputFilename` is provided, mdimg writes
 * the string directly to disk.
 *
 * @example
 * ```ts
 * import { createHtmlOutputProcessor } from 'mdimg';
 *
 * const { data } = await mdimg({
 *   inputText: '# Hello',
 *   encoding: 'base64',          // ignored by this processor
 *   outputProcessor: createHtmlOutputProcessor(),
 * });
 * // data is a string containing the full HTML document
 * ```
 */
export declare const createHtmlOutputProcessor: () => IOutputProcessor;
