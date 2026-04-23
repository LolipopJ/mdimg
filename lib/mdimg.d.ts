import type { IConvertOptions, IConvertResponse } from "./interfaces";
declare const mdimg: ({ inputText, inputFilename, mdText, mdFile, outputFilename, type, width, height, encoding, quality, htmlText, cssText, htmlTemplate, cssTemplate, theme, extensions, plugins, log, debug, puppeteerProps, outputProcessor, }: IConvertOptions) => Promise<IConvertResponse>;
export { mdimg as convert2img, mdimg };
export { createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor, } from "./output";
