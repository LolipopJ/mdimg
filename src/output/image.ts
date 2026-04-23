import type {
  IConvertEncodingOption,
  IConvertTypeOption,
  IOutputProcessor,
  IOutputProcessorContext,
  IOutputProcessorResult,
} from "../interfaces";

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
export const createImageOutputProcessor = (
  type: IConvertTypeOption,
  quality: number | undefined,
  encoding: IConvertEncodingOption,
): IOutputProcessor => ({
  format: type,
  requiresPage: true,

  async process({
    body,
  }: IOutputProcessorContext): Promise<IOutputProcessorResult> {
    if (!body) {
      throw new Error(
        "Image output processor requires a Puppeteer ElementHandle for #mdimg-body.",
      );
    }

    if (encoding === "base64") {
      const data = await body.screenshot({ type, quality, encoding: "base64" });
      return { data };
    }

    const data = await body.screenshot({ type, quality, encoding: "binary" });
    return { data };
  },
});
