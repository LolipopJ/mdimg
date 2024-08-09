import type { IConvertOptions } from "../interfaces";
declare const spliceHtml: ({ inputHtml, htmlText, cssText, htmlTemplate, cssTemplate, log, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate" | "log"> & {
    inputHtml: string;
}) => string;
export { spliceHtml };
