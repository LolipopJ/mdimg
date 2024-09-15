import type { IConvertOptions } from "../interfaces";
declare const spliceHtml: ({ inputHtml, htmlText, cssText, htmlTemplate, cssTemplate, theme, log, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "theme" | "log"> & {
    inputHtml: string;
}) => string;
export { spliceHtml };
