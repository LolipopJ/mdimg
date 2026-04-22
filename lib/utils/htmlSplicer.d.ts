import type { IConvertOptions, IExtension } from "../interfaces";
declare const spliceHtml: ({ renderedHtml, htmlText, cssText, htmlTemplate, cssTemplate, theme, resolvedExtensions, log, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "theme" | "log"> & {
    /** HTML document parsed by Markdown source */
    renderedHtml: string;
    /** Fully resolved extension list (built-ins + plugin overrides) from PluginManager */
    resolvedExtensions?: IExtension[];
}) => Promise<string>;
export { spliceHtml };
