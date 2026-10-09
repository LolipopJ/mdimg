import { readFileSync } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const task = getDocument({
  data: new Uint8Array(readFileSync(0)),
  useSystemFonts: true,
});
try {
  const pdf = await task.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { width, height } = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    pages.push({
      width,
      height,
      text: items
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " "),
    });
  }
  process.stdout.write(JSON.stringify(pages));
} finally {
  await task.destroy();
}
