import type { IConvertEncodingOption, IConvertTypeOption, IOutputProcessor } from "../interfaces";
/**
 * Built-in output processor that captures the `#mdimg-body` element as a
 * PNG / JPEG / WebP image via Puppeteer's `ElementHandle.screenshot()`.
 *
 * This is the default processor used when no `outputProcessor` is specified.
 *
 * @param type     Image format (`"png"`, `"jpeg"`, or `"webp"`).
 * @param quality  JPEG/WebP quality (1–100). Ignored for PNG.
 * @param encoding `"binary"` (default) or `"base64"`.
 */
export declare const createImageOutputProcessor: (type: IConvertTypeOption, quality: number | undefined, encoding: IConvertEncodingOption) => IOutputProcessor;
