import type { IConvertOptions } from "../interfaces";
declare const spliceHtml: ({ renderedHtml, htmlText, cssText, htmlTemplate, cssTemplate, theme, extensions, log, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "theme" | "extensions" | "log"> & {
    /** HTML document parsed by Markdown source */
    renderedHtml: string;
}) => string;
export { spliceHtml };
