import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import type { IConvertOptions } from "../interfaces";

export const writeFileSafely = (
  filename: string,
  data: Uint8Array | string,
) => {
  const _filePath = path.dirname(filename);
  fs.mkdirSync(_filePath, { recursive: true });

  const _tempFilename = path.join(_filePath, `.mdimg_${randomUUID()}.tmp`);
  // Only clean up files we successfully created; a collision belongs to someone else.
  const _fd = fs.openSync(_tempFilename, "wx");
  try {
    try {
      fs.writeFileSync(_fd, data);
    } finally {
      fs.closeSync(_fd);
    }
    fs.renameSync(_tempFilename, filename);
  } catch (error: unknown) {
    fs.rmSync(_tempFilename, { force: true });
    throw error;
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
  return `mdimg_${_outputFilenameSuffix}_${randomUUID()}.${type}`;
};
