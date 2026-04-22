#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const { mkdirSync, writeFileSync } = require("fs");
const { join, dirname } = require("path");

const STATIC_DIR = join(__dirname, "..", "static");
const JSDELIVR_CDN_BASE = "https://cdn.jsdelivr.net/npm";
const JSDELIVR_API_BASE = "https://data.jsdelivr.com/v1/packages/npm";
const CONCURRENCY = 8;

/**
 * Download sources configuration.
 *
 * Each entry is either:
 *   - A string '{package}/{file}' — same path on CDN and saved locally under static/
 *   - An object { cdn, local } — different paths on CDN vs. local
 *
 * Paths are relative to the npm package root (e.g. 'normalize.css/normalize.min.css').
 * Scoped packages are supported (e.g. '@highlightjs/cdn-assets/styles/default.min.css').
 * A single '*' wildcard matches any sequence of non-slash characters within one path segment.
 *
 * Examples:
 *   'normalize.css/normalize.min.css'
 *   { cdn: 'mathjax/es5/tex-mml-chtml.min.js', local: 'mathjax/tex-mml-chtml.min.js' }
 *   '@highlightjs/cdn-assets@11.11.1/styles/*'
 */
const SOURCES = [
  "@highlightjs/cdn-assets@11.11.1/highlight.min.min.js",
  "@highlightjs/cdn-assets@11.11.1/styles/*.min.css",
  "@highlightjs/cdn-assets@11.11.1/styles/*.png",
  "@highlightjs/cdn-assets@11.11.1/styles/*.jpg",
  "@highlightjs/cdn-assets@11.11.1/styles/base16/*.min.css",
  "@highlightjs/cdn-assets@11.11.1/styles/base16/*.png",
  "@highlightjs/cdn-assets@11.11.1/styles/base16/*.jpg",
  "github-markdown-css@5.9.0/github-markdown-dark.min.css",
  "github-markdown-css@5.9.0/github-markdown-light.min.css",
  "mathjax@4.1.1/tex-mml-chtml.min.js",
  "mermaid@11.14.0/dist/mermaid.min.min.js",
  "normalize.css@8.0.1/normalize.min.css",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an npm package name and in-package file path from a combined path string.
 * Handles scoped packages (@scope/name).
 *
 * @param {string} fullPath  e.g. 'normalize.css/normalize.min.css' or
 *                           '@highlightjs/cdn-assets/styles/default.min.css'
 * @returns {{ packageName: string, filePath: string }}
 */
function parsePath(fullPath) {
  if (fullPath.startsWith("@")) {
    // Scoped package: first slash separates @scope from name,
    // second slash separates package name from file path.
    const firstSlash = fullPath.indexOf("/");
    const secondSlash = fullPath.indexOf("/", firstSlash + 1);
    if (firstSlash === -1 || secondSlash === -1) {
      throw new Error(
        `Invalid scoped package path (missing file): ${fullPath}`,
      );
    }
    return {
      packageName: fullPath.slice(0, secondSlash),
      filePath: fullPath.slice(secondSlash + 1),
    };
  }

  const slash = fullPath.indexOf("/");
  if (slash === -1) {
    throw new Error(`Invalid package path (missing file): ${fullPath}`);
  }
  return {
    packageName: fullPath.slice(0, slash),
    filePath: fullPath.slice(slash + 1),
  };
}

/**
 * Convert a glob pattern (where '*' is a single non-slash-segment wildcard)
 * to a RegExp with one capture group per '*'.
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "([^/]+)");
  return new RegExp(`^${escaped}$`);
}

/** Cache: packageName → string[] of relative file paths (no leading slash) */
const packageFilesCache = new Map();

/**
 * Fetch and cache the full file list for an npm package from jsDelivr.
 *
 * @param {string} packageName  e.g. '@highlightjs/cdn-assets'
 * @returns {Promise<string[]>}  relative file paths, e.g. ['styles/default.min.css', ...]
 */
async function fetchPackageFiles(packageName) {
  if (packageFilesCache.has(packageName)) {
    return packageFilesCache.get(packageName);
  }

  const apiUrl = `${JSDELIVR_API_BASE}/${packageName}?structure=flat`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(
      `jsDelivr API error for package "${packageName}": ${res.status} ${res.statusText}`,
    );
  }

  const { files } = await res.json();
  const paths = files.map(({ name }) => name.replace(/^\//, ""));
  packageFilesCache.set(packageName, paths);
  return paths;
}

/**
 * Resolve a wildcard CDN file pattern using the jsDelivr package listing API.
 * Returns an array of { cdnPath, localPath } pairs ready to download.
 *
 * @param {string} cdnPattern    e.g. '@highlightjs/cdn-assets/styles/*'
 * @param {string} localPattern  e.g. '@highlightjs/cdn-assets/build/styles/*'
 * @returns {Promise<Array<{ cdnPath: string, localPath: string }>>}
 */
async function resolveWildcard(cdnPattern, localPattern) {
  const { packageName: cdnPkg, filePath: cdnFileGlob } = parsePath(cdnPattern);
  const { packageName: localPkg, filePath: localFileGlob } =
    parsePath(localPattern);

  const allFiles = await fetchPackageFiles(cdnPkg);
  const regex = globToRegex(cdnFileGlob);
  const results = [];

  for (const relName of allFiles) {
    const match = relName.match(regex);
    if (!match) continue;

    // Replace each '*' in localFileGlob with the corresponding captured group.
    let localFile = localFileGlob;
    for (let i = 1; i < match.length; i++) {
      localFile = localFile.replace("*", match[i]);
    }

    results.push({
      cdnPath: `${cdnPkg}/${relName}`,
      localPath: `${localPkg}/${localFile}`,
    });
  }

  return results;
}

/**
 * Download a single file from the jsDelivr CDN and save it locally under static/.
 *
 * @param {string} cdnPath    Path relative to cdn.jsdelivr.net/npm/
 * @param {string} localPath  Path relative to the static/ directory
 */
async function downloadFile(cdnPath, localPath) {
  const url = `${JSDELIVR_CDN_BASE}/${cdnPath}`;
  const dest = join(STATIC_DIR, localPath);

  process.stdout.write(`Downloading ${cdnPath} ... `);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buffer);

  console.log(`saved (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Phase 1: resolve all patterns into a flat list of download tasks
  const tasks = [];
  for (const source of SOURCES) {
    const cdnPattern = typeof source === "string" ? source : source.cdn;
    const localPattern = typeof source === "string" ? source : source.local;

    try {
      if (cdnPattern.includes("*")) {
        const resolved = await resolveWildcard(cdnPattern, localPattern);
        if (resolved.length === 0) {
          console.warn(`Warning: no files matched pattern "${cdnPattern}"`);
        }
        tasks.push(...resolved);
      } else {
        tasks.push({ cdnPath: cdnPattern, localPath: localPattern });
      }
    } catch (err) {
      console.error(`Error resolving "${cdnPattern}": ${err.message}`);
    }
  }

  // Phase 2: download with concurrency limit
  let downloaded = 0;
  let failed = 0;
  const executing = new Set();

  for (const { cdnPath, localPath } of tasks) {
    const p = downloadFile(cdnPath, localPath)
      .then(() => {
        downloaded++;
      })
      .catch((err) => {
        console.error(`Error downloading "${cdnPath}": ${err.message}`);
        failed++;
      })
      .finally(() => executing.delete(p));
    executing.add(p);
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);

  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
