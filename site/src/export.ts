import { getFontEmbedCSS, toCanvas } from "html-to-image";

import type { Config } from "./config";

export async function exportImage(
  root: HTMLElement,
  options: Pick<Config, "type" | "quality">,
): Promise<Blob> {
  const bounds = root.getBoundingClientRect();
  const width = Math.ceil(Math.max(bounds.width, root.scrollWidth));
  const height = Math.ceil(Math.max(bounds.height, root.scrollHeight));
  if (!width || !height) throw new Error("The article has no dimensions");
  let backgroundColor: string | undefined;
  if (options.type === "jpeg") {
    backgroundColor = "white";
    for (let node: HTMLElement | null = root; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      if (color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
        backgroundColor = color;
        break;
      }
    }
  }
  // html-to-image otherwise tolerates missing fonts/images. Promote them to failures.
  const originalFetch = window.fetch;
  const failures: string[] = [];
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok)
        throw new Error(
          `Export resource failed: ${response.url} (${response.status})`,
        );
      return response;
    } catch (error) {
      failures.push(
        `${String(args[0])}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  };
  let canvas: HTMLCanvasElement | undefined;
  try {
    // The library's font traversal stops at SVG; include its HTML labels explicitly.
    const fontNodes = [
      root,
      ...Array.from(
        root.querySelectorAll<HTMLElement>("foreignObject > *"),
      ).filter((node) => node instanceof HTMLElement),
    ];
    const fontEmbedCSS = [
      ...new Set(
        await Promise.all(fontNodes.map((node) => getFontEmbedCSS(node))),
      ),
    ].join("\n");
    if (failures.length) throw new Error(failures.join("\n"));
    canvas = await toCanvas(root, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      skipAutoScale: true,
      backgroundColor,
      fontEmbedCSS,
      onImageErrorHandler: (event) => {
        throw new Error(`Export image failed to load: ${String(event)}`);
      },
    });
    if (failures.length) throw new Error(failures.join("\n"));
    if (canvas.width !== width || canvas.height !== height)
      throw new Error("The browser truncated the article canvas");
    const mime = `image/${options.type}`;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas!.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(
                new Error("The browser could not encode the full article"),
              ),
        mime,
        options.type === "png" ? undefined : options.quality / 100,
      );
    });
    if (blob.type !== mime)
      throw new Error(
        `The browser does not support ${mime}; it returned ${blob.type}`,
      );
    const decoded = await createImageBitmap(blob);
    try {
      if (decoded.width !== width || decoded.height !== height)
        throw new Error("Image dimensions do not match the full article");
    } finally {
      decoded.close();
    }
    return blob;
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}. Retry, or reduce the render width to use less canvas memory.`,
      { cause: error },
    );
  } finally {
    window.fetch = originalFetch;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
