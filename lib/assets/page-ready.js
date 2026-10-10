/* global document, window */

(() => {
  let resolveReady;
  let rejectReady;
  window.__mdimgTasks = [];
  window.__mdimgReady = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // The exported page keeps the rejection available to callers without emitting
  // a second, unhandled rejection for the same diagnostic.
  window.__mdimgReady.catch(() => {});

  const fail = (source, error) => {
    const message = `mdimg ${source}: ${error?.message || String(error)}`;
    window.__mdimgError ??= message;
    rejectReady(new Error(window.__mdimgError));
    console.error(message);
  };
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target?.tagName === "IMG") return;
      fail(
        "page script/resource",
        event.error ||
          event.message ||
          target?.getAttribute?.("src") ||
          "load failed",
      );
    },
    true,
  );
  window.addEventListener("unhandledrejection", (event) =>
    fail("page promise", event.reason),
  );

  document.addEventListener(
    "DOMContentLoaded",
    async () => {
      let timer;
      let active = "page";
      try {
        await Promise.race([
          (async () => {
            for (const task of window.__mdimgTasks) {
              active = task.name;
              await task.run();
            }
            active = "images/fonts";
            await document.fonts.ready;
            await Promise.all(
              Array.from(document.images, async (image) => {
                if (!image.complete) {
                  await new Promise((resolve, reject) => {
                    image.addEventListener("load", resolve, { once: true });
                    image.addEventListener(
                      "error",
                      () =>
                        reject(
                          new Error(
                            `image ${image.getAttribute("src")} failed to load`,
                          ),
                        ),
                      { once: true },
                    );
                  });
                }
                if (!image.naturalWidth)
                  throw new Error(
                    `image ${image.getAttribute("src")} failed to load`,
                  );
                await image.decode();
              }),
            );
          })(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error("readiness timeout (30000ms)")),
              30000,
            );
          }),
        ]);
        if (!window.__mdimgError) resolveReady();
      } catch (error) {
        fail(active, error);
      } finally {
        clearTimeout(timer);
      }
    },
    { once: true },
  );
})();
