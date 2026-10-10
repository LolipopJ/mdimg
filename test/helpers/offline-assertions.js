/* eslint-disable no-undef */

async function waitForReady(page, timeout = 30000) {
  return page.evaluate(async (milliseconds) => {
    if (
      !globalThis.__mdimgReady ||
      typeof globalThis.__mdimgReady.then !== "function"
    ) {
      throw new Error("Missing mdimg page readiness Promise");
    }
    let timer;
    try {
      await Promise.race([
        globalThis.__mdimgReady,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("mdimg readiness timeout")),
            milliseconds,
          );
        }),
      ]);
      if (globalThis.__mdimgError)
        throw new Error(String(globalThis.__mdimgError));
    } finally {
      clearTimeout(timer);
    }
  }, timeout);
}
async function expectDocument(
  page,
  { math = true, mermaid = true, highlight = true, attachment = true } = {},
) {
  const content = await page.evaluate(() => {
    const formulas = [
      ...globalThis.document.querySelectorAll('mjx-container[jax="SVG"] > svg'),
    ];
    const diagrams = [...globalThis.document.querySelectorAll(".mermaid svg")];
    const code = globalThis.document.querySelector("code.language-javascript");
    const image = globalThis.document.querySelector(
      'img[alt="offline attachment"]',
    );
    return {
      heading: globalThis.document.querySelector("h1")?.textContent,
      formulas: formulas.map((svg) => ({
        paths: svg.parentElement.querySelectorAll("path").length,
        uses: [...svg.querySelectorAll("use")].map(
          (use) => use.getAttribute("href") || use.getAttribute("xlink:href"),
        ),
        width: svg.getBoundingClientRect().width,
        localReferences: [...svg.querySelectorAll("use")].every((use) => {
          const href =
            use.getAttribute("href") || use.getAttribute("xlink:href");
          return (
            href?.startsWith("#") &&
            Boolean(svg.parentElement.querySelector(href))
          );
        }),
      })),
      errors: globalThis.document.querySelectorAll(
        'mjx-merror, [data-mjx-error], mjx-container [data-mml-node="merror"]',
      ).length,
      diagrams: diagrams.map((svg) => ({
        width: svg.getBoundingClientRect().width,
        shapes: svg.querySelectorAll("path, rect, line").length,
      })),
      diagramMath: globalThis.document.querySelectorAll(".mermaid math").length,
      highlighted: code?.querySelectorAll('[class*="hljs-"]').length ?? 0,
      codeBackground: code
        ? globalThis.getComputedStyle(code).backgroundImage
        : "none",
      unknown: globalThis.document.querySelector(
        "code.language-no-such-language",
      )?.textContent,
      plain: [...globalThis.document.querySelectorAll("pre code")].some(
        (node) => node.textContent.includes("plain code stays readable"),
      ),
      attachment: Boolean(image?.complete && image.naturalWidth === 96),
    };
  });
  expect(content.heading).toBe("Offline acceptance");
  expect(content.unknown?.trim()).toBe("unknown language stays readable");
  expect(content.plain).toBe(true);
  expect(content.errors).toBe(0);
  if (math) {
    expect(content.formulas.length >= 3).toBeTruthy();
    expect(
      content.formulas.every(
        (formula) => formula.paths > 0 && formula.width > 0,
      ),
    ).toBeTruthy();
    expect(
      content.formulas.every(
        (formula) =>
          formula.localReferences &&
          formula.uses.every((href) => href?.startsWith("#")),
      ),
    ).toBeTruthy();
  } else expect(content.formulas.length).toBe(0);
  if (mermaid) {
    expect(content.diagrams.length).toBe(2);
    expect(
      content.diagrams.every(
        (diagram) => diagram.width > 0 && diagram.shapes > 0,
      ),
    ).toBeTruthy();
    expect(content.diagramMath > 0).toBeTruthy();
  } else expect(content.diagrams.length).toBe(0);
  if (highlight) expect(content.highlighted >= 2).toBeTruthy();
  else expect(content.highlighted).toBe(0);
  if (attachment) expect(content.attachment).toBe(true);
  return content;
}
async function expectPng(browser, data, expectedWidth = 800) {
  const bytes = Buffer.from(data);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  try {
    const pixels = await page.evaluate(
      async (source) => {
        const image = new globalThis.Image();
        image.src = source;
        await image.decode();
        const canvas = globalThis.document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const drawing = canvas.getContext("2d");
        drawing.drawImage(image, 0, 0);
        const values = drawing.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        const first = values.slice(0, 4);
        const colors = new Set();
        let changed = 0;
        for (let index = 0; index < values.length; index += 4) {
          if (first.some((value, channel) => value !== values[index + channel]))
            changed++;
          if (colors.size < 1000)
            colors.add(
              `${values[index]},${values[index + 1]},${values[index + 2]}`,
            );
        }
        return {
          width: canvas.width,
          height: canvas.height,
          contentFraction: changed / (values.length / 4),
          colors: colors.size,
        };
      },
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
    expect(pixels.width).toBe(expectedWidth);
    expect(pixels.height >= 300).toBeTruthy();
    expect(pixels.contentFraction > 0.01).toBeTruthy();
    expect(pixels.colors > 10).toBeTruthy();
    return {
      bytes: bytes.length,
      ...pixels,
    };
  } finally {
    await context.close();
  }
}
async function expectOfflinePdf(data) {
  const { getDocument } = await importPackage(
    requirePackage(__filename).resolve("pdfjs-dist/legacy/build/pdf.mjs"),
  );
  const task = getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
  });
  try {
    const document = await task.promise;
    let text = "";
    let operators = 0;
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      text += (await page.getTextContent()).items
        .map((item) => item.str)
        .join(" ");
      operators += (await page.getOperatorList()).fnArray.length;
    }
    const compactText = text.replace(/\s/g, "");
    expect(compactText.includes("Offlineacceptance")).toBeTruthy();
    expect(compactText.includes("answer")).toBeTruthy();
    expect(compactText.includes("Offlineend")).toBeTruthy();
    expect(operators > 100).toBeTruthy();
    return {
      bytes: data.length,
      pages: document.numPages,
      operators,
    };
  } finally {
    await task.destroy();
  }
}

module.exports = { waitForReady, expectDocument, expectPng, expectOfflinePdf };
