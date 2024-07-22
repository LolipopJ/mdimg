import type { IConvertOptions, IConvertResponse } from "./interfaces";
declare const mdimg: ({ inputText, inputFilename, mdText, mdFile, outputFilename, type, width, height, encoding, quality, htmlText, cssText, htmlTemplate, cssTemplate, log, puppeteerProps, }: IConvertOptions) => Promise<IConvertResponse>;
export { mdimg, mdimg as convert2img };
