export interface IConvertOptions {
  inputText?: string;
  inputFilename?: string;
  /** @deprecated: rename to `inputText` */
  mdText?: string;
  /** @deprecated: rename to `inputFilename` */
  mdFile?: string;
  outputFilename?: string;
  type?: IConvertTypeOption;
  width?: number;
  height?: number;
  encoding?: IConvertEncodingOption;
  quality?: number;
  htmlText?: string;
  cssText?: string;
  htmlTemplate?: "default" | "words";
  cssTemplate?: "default" | "empty" | "github" | "githubDark" | "words";
  log?: boolean;
  puppeteerProps?: import("puppeteer").LaunchOptions;
}

export interface IConvertResponse {
  data: string | Buffer;
  path?: string;
  html: string;
}

export type IConvertTypeOption = "jpeg" | "png" | "webp";

export type IConvertEncodingOption = "binary" | "base64";
