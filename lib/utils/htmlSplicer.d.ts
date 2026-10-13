import type { IConvertOptions, IExtension } from "../interfaces";
declare const spliceHtml: ({ renderedHtml, htmlText, cssText, htmlTemplate, cssTemplate, resolvedExtensions, log, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "log"> & {
    /** HTML document parsed by Markdown source */
    renderedHtml: string;
    /** Fully resolved extension list (built-ins + plugin overrides) from PluginManager */
    resolvedExtensions?: IExtension[];
}) => Promise<string>;
export { spliceHtml };
