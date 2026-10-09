/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg, createImageOutputProcessor } = require("../lib/mdimg.js");
const { expectPdf, useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const expectImage = useImageAssertions();

test("VALIDATION: a PNG header without image data fails decoding", async () => {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  await expect(expectImage(header, "png")).rejects.toThrow();
});

test("VALIDATION: a valid but blank PNG fails the content assertion", async () => {
  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    extensions: false,
    cssText:
      "body { margin: 0; } #mdimg-body { height: 100px; background: white; } .markdown-body { display: none; }",
    outputProcessor: createImageOutputProcessor("png", undefined, "binary"),
  });
  await expect(expectImage(result.data, "png")).rejects.toThrow(
    /hasContent|true/,
  );
});

test("VALIDATION: a readable image with the wrong width fails the size assertion", async () => {
  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    extensions: false,
    width: 320,
    outputProcessor: createImageOutputProcessor("png", undefined, "binary"),
  });
  await expect(expectImage(result.data, "png", { width: 640 })).rejects.toThrow(
    /640/,
  );
});

test("VALIDATION: a PDF header without a document fails parsing", () => {
  expect(() => expectPdf(Buffer.from("%PDF-1.7\n%%EOF\n"))).toThrow();
});
