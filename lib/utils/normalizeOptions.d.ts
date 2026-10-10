import type { IConvertOptions } from "../interfaces";
/** Shared validation for library calls and CLI conversions, before any I/O. */
export declare const normalizeOptions: (options: IConvertOptions) => {
    inputText: string | undefined;
    inputFilename: string | undefined;
    outputFilename: string | undefined;
    type: import("../interfaces").IConvertTypeOption;
    width: number;
    height: number;
    encoding: import("../interfaces").IConvertEncodingOption;
    quality: number;
    htmlText: string | undefined;
    cssText: string | undefined;
    htmlTemplate: string;
    cssTemplate: string;
    theme: "light" | "dark";
    extensions: boolean | import("../interfaces").IExtensionOptions;
    plugins: import("../interfaces").IPlugin[];
    log: boolean;
    debug: boolean;
    puppeteerProps: import("puppeteer").LaunchOptions;
    outputProcessor: import("../interfaces").IOutputProcessor | undefined;
};
