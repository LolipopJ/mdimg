import type { IConvertOptions, IConvertResponse } from "./interfaces";
declare const mdimg: ({ inputText, inputFilename, mdText, mdFile, outputFilename, type, width, height, encoding, quality, htmlText, cssText, htmlTemplate, cssTemplate, theme, extensions, log, debug, puppeteerProps, }: IConvertOptions) => Promise<IConvertResponse>;
export { mdimg as convert2img, mdimg };
