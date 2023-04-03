// import puppeteer from "puppeteer";

interface IProps {
  mdText: string;
  mdFile: string;
  outputFilename?: string;
  type?: "jpeg" | "png" | "webp";
  width?: number;
  height?: number;
  encoding?: "binary" | "base64";
  quality?: number;
  htmlTemplate?: "";
  cssTemplate?: "";
  log?: boolean;
  // puppeteerProps: puppeteer
}

export async function convert2img({
  mdText,
  mdFile,
  outputFilename,
  type = "png",
  width = 800,
  height = 600,
  encoding = "binary",
  quality,
  htmlTemplate = "default",
  cssTemplate = "default",
  log = false,
  puppeteerProps,
}: IProps): string;
