import type { IConvertOptions, IExtension } from "../interfaces";
declare const spliceHtml: ({ renderedHtml, htmlText, cssText, htmlTemplate, cssTemplate, resolvedExtensions, log, baseUrl, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "log"> & {
    /** HTML document parsed by Markdown source */
    renderedHtml: string;
    /** Fully resolved extension list (built-ins + plugin overrides) from PluginManager */
    resolvedExtensions?: IExtension[];
    /** Preserve the source directory for relative resources when HTML is relocated. */
    baseUrl?: string;
}) => Promise<string>;
export { spliceHtml };
