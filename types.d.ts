import type { LaunchOptions } from "puppeteer";

export interface IOptions {
  mdText?: string;
  mdFile?: string;
  outputFilename?: string;
  type?: "jpeg" | "png" | "webp";
  width?: number;
  height?: number;
  encoding?: "binary" | "base64";
  quality?: number;
  htmlTemplate?: "default" | "words";
  cssTemplate?: "default" | "empty" | "github" | "githubDark" | "words";
  log?: boolean;
  puppeteerProps?: LaunchOptions;
}

export interface IResponse {
  data: string | Buffer;
  path?: string;
  html: string;
}

export type convert2img = (props: IOptions) => Promise<IResponse>;
