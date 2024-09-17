import fs from "fs";
import path from "path";

import type { IConvertOptions } from "../interfaces";

export const createEmptyFile = (filename: string) => {
  const _filePath = path.dirname(filename);

  try {
    fs.mkdirSync(_filePath, { recursive: true });
    fs.writeFileSync(filename, "");
  } catch (error: unknown) {
    throw new Error(
      `Error: create new file ${filename} failed.\n${String(error)}\n`,
    );
  }
};

export const padStartWithZero = (num: number, length: number) => {
  return String(num).padStart(length, "0");
};

export const generateImageDefaultFilename = (type: IConvertOptions["type"]) => {
  const _now = new Date();
  const _outputFilenameSuffix = `${_now.getFullYear()}_${padStartWithZero(
    _now.getMonth() + 1,
    2,
  )}_${padStartWithZero(_now.getDate(), 2)}_${padStartWithZero(
    _now.getHours(),
    2,
  )}_${padStartWithZero(_now.getMinutes(), 2)}_${padStartWithZero(
    _now.getSeconds(),
    2,
  )}_${padStartWithZero(_now.getMilliseconds(), 3)}`;
  return `mdimg_${_outputFilenameSuffix}.${type}`;
};
