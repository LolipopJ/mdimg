/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { load } = require("cheerio");
const { execFileSync } = require("child_process");
const { resolve } = require("path");
const puppeteer = require("puppeteer");

function expectMarkdown(html) {
  const $ = load(html);
  expect($("#mdimg-body .markdown-body h1").text()).toBe("Hello");
  expect($(".markdown-body strong").text()).toBe("test");
  expect($(".markdown-body pre code.language-js").text()).toContain(
    "console.log('hi');",
  );
}

function useImageAssertions() {
  let browser;

  afterAll(async () => {
    if (browser) await browser.close();
  });

  return async function expectImage(
    data,
    format,
    { width, height, pixel } = {},
  ) {
    const buffer = Buffer.from(data);
    switch (format) {
      case "png":
        expect(buffer.subarray(0, 8)).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        );
        break;
      case "jpeg":
        expect(buffer.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
        expect(buffer.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
        break;
      case "webp":
        expect(buffer.subarray(0, 4).toString()).toBe("RIFF");
        expect(buffer.subarray(8, 12).toString()).toBe("WEBP");
        expect(buffer.readUInt32LE(4) + 8).toBe(buffer.length);
        break;
      default:
        throw new Error(`Unsupported test image format: ${format}`);
    }

    browser ??= await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    try {
      const decoded = await page.evaluate(
        async (src) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;
          const firstPixel = Array.from(pixels.slice(0, 4));
          let hasContent = false;
          for (let i = 4; i < pixels.length; i += 4) {
            if (
              firstPixel.some((value, channel) => pixels[i + channel] !== value)
            ) {
              hasContent = true;
              break;
            }
          }
          return {
            width: image.naturalWidth,
            height: image.naturalHeight,
            firstPixel,
            hasContent,
          };
        },
        `data:image/${format};base64,${buffer.toString("base64")}`,
      );

      expect(decoded.width).toBe(width ?? 800);
      if (height !== undefined) expect(decoded.height).toBe(height);
      else expect(decoded.height).toBeGreaterThanOrEqual(100);
      expect(decoded.hasContent).toBe(true);
      if (pixel) expect(decoded.firstPixel).toEqual(pixel);
      return decoded;
    } finally {
      await page.close();
    }
  };
}

function expectPdf(data) {
  const pages = JSON.parse(
    execFileSync(process.execPath, [resolve(__dirname, "read-pdf.mjs")], {
      input: Buffer.from(data),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10000,
    }),
  );
  expect(pages).toHaveLength(1);
  expect(pages[0].width).toBeCloseTo(288, 0);
  expect(pages[0].height).toBeCloseTo(216, 0);
  expect(pages[0].text).toContain("Hello");
  expect(pages[0].text).toContain("This is a test document.");
  expect(pages[0].text).toContain("console.log('hi');");
}

module.exports = { expectMarkdown, expectPdf, useImageAssertions };
