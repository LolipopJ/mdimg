interface IConvertOptions {
  mdText?: string;
  mdFile?: string;
  outputFilename?: string;
  type?: IConvertTypeOption;
  width?: number;
  height?: number;
  encoding?: IConvertEncodingOption;
  quality?: number;
  htmlTemplate?: string /** "default" | "words" */;
  cssTemplate?: string /** "default" | "empty" | "github" | "githubDark" | "words" */;
  log?: boolean;
  puppeteerProps?: import("puppeteer").LaunchOptions;
}

interface IConvertResponse {
  data: string | Buffer;
  path?: string;
  html: string;
}

type IConvertTypeOption = "jpeg" | "png" | "webp";

type IConvertEncodingOption = "binary" | "base64";
