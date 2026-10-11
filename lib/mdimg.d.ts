import type { IConvertOptions, IConvertResponse } from "./interfaces";
declare const mdimg: (options: IConvertOptions) => Promise<IConvertResponse>;
export { mdimg };
export type { IConvertEncodingOption, IConvertOptions, IConvertResponse, IConvertTypeOption, IExtension, IExtensionContext, IExtensionInjectResult, IExtensionOptions, IHighlightJsTheme, IHooks, IOutputProcessor, IOutputProcessorContext, IOutputProcessorResult, IPlugin, } from "./interfaces";
export { createHtmlOutputProcessor, createImageOutputProcessor, createPdfOutputProcessor, } from "./output";
