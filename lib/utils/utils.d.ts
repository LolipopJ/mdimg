import type { IConvertOptions } from "../interfaces";
export declare const writeFileSafely: (filename: string, data: Uint8Array | string) => void;
export declare const padStartWithZero: (num: number, length: number) => string;
export declare const generateImageDefaultFilename: (type: IConvertOptions["type"]) => string;
