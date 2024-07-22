import type { IConvertOptions } from "../interfaces";
declare const spliceHtml: ({ inputHtml, htmlText, cssText, htmlTemplate, cssTemplate, }: Pick<IConvertOptions, "htmlText" | "cssText" | "htmlTemplate" | "cssTemplate"> & {
    inputHtml: string;
}) => string;
export { spliceHtml };
