/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { existsSync } = require("node:fs");

async function findBrowser() {
  const candidates = [
    process.env.MDIMG_BROWSER,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : undefined,
  ];
  let executablePath = candidates.find(
    (candidate) => candidate && existsSync(candidate),
  );
  executablePath ??=
    await requirePackage(__filename)("puppeteer").executablePath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error(
      "Preinstall Chromium or set MDIMG_BROWSER; this check never downloads a browser",
    );
  }
  return executablePath;
}

async function prepareOfflinePage(page, externalRequests, pageErrors) {
  await page.setCacheEnabled(false);
  const session = await page.createCDPSession();
  await session.send("Network.clearBrowserCache");
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (/^https?:/i.test(request.url())) {
      externalRequests.push(request.url());
      void request.abort();
    } else {
      void request.continue();
    }
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.setOfflineMode(true);
}

module.exports = { findBrowser, prepareOfflinePage };
