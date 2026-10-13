# Graph Report - mdimg  (2026-10-13)

## Corpus Check
- Corpus is ~40,383 words - fits in a single context window. You may not need a graph.

## Summary
- 694 nodes · 1088 edges · 48 communities (32 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core Markdown Rendering
- Browser Preview Editor
- CLI Offline Acceptance
- Development Tool Dependencies
- Published Type Declarations
- CommonJS CLI Rendering
- ESM Rendering Plugins
- Package Public Contract
- Documented Rendering Contracts
- Core TypeScript Configuration
- Bundled Asset Build
- Development Build Commands
- Packed Consumer Checks
- Build Package Environment
- Preview TypeScript Configuration
- Node Conversion Assertions
- DOM Validation Helpers
- Runtime Browser Verification
- Preview Resource Manifest
- Plugin Hook Tests
- Temporary Workspace Tests
- JavaScript Rollup Bundling
- Offline Resource Tests
- HTML Template Tests
- JavaScript Lint Rules
- Public Package Types
- Sass PDF Utilities
- Output Format Tests
- Safe File Writes
- Preview Source Tests
- Runtime Library Dependencies
- Repository Metadata
- Source Formatting Rules
- Preview Package Metadata
- CLI Binary Entry
- Issue Tracker Metadata
- Node Runtime Requirements
- Node Type Dependencies
- Syntax Highlighting Bridge

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 22 edges
2. `scripts` - 19 edges
3. `mdimg()` - 15 edges
4. `compilerOptions` - 13 edges
5. `PluginManager` - 12 edges
6. `IExtension` - 11 edges
7. `Browser preview editor` - 11 edges
8. `v()` - 10 edges
9. `buildAssets()` - 10 edges
10. `readAsset()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Complete article image export` --semantically_similar_to--> `Template DOM contract`  [INFERRED] [semantically similar]
  site/README.md → README.md
- `Chromium preview verification` --semantically_similar_to--> `Packed consumer verification`  [INFERRED] [semantically similar]
  site/README.md → README.md
- `Preview site deployment` --implements--> `Browser preview editor`  [INFERRED]
  .github/workflows/pages.yml → site/README.md
- `Markdown rendering sample` --conceptually_related_to--> `MathJax SVG rendering`  [INFERRED]
  test/static/test.md → README.md
- `Browser preview editor` --references--> `Highlight.js syntax highlighting`  [EXTRACTED]
  site/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Built-in rendering extensions** — readme_mathjax, readme_mermaid, readme_highlight_js [EXTRACTED 1.00]

## Communities (48 total, 16 thin omitted)

### Community 0 - "Core Markdown Rendering"
Cohesion: 0.10
Nodes (37): puppeteer, createHighlightJsExtension(), createBuiltinExtensions(), createMathJaxExtension(), createMermaidExtension(), IConvertEncodingOption, IConvertOptions, IConvertResponse (+29 more)

### Community 1 - "Browser Preview Editor"
Cohesion: 0.09
Nodes (34): dompurify, html-to-image, react, react-dom, App(), createCalls(), quoteShell(), Shell (+26 more)

### Community 2 - "CLI Offline Acceptance"
Cohesion: 0.06
Nodes (38): cliFilename, { execFileSync, spawnSync }, expectImage, { findBrowser, prepareOfflinePage }, { load }, { pathToFileURL }, puppeteer, { readFileSync, readdirSync, writeFileSync } (+30 more)

### Community 3 - "Development Tool Dependencies"
Cohesion: 0.04
Nodes (45): devDependencies, @babel/core, @babel/node, @babel/preset-env, dompurify, eslint, eslint-config-prettier, @eslint/js (+37 more)

### Community 4 - "Published Type Declarations"
Cohesion: 0.05
Nodes (16): IConvertEncodingOption, IConvertOptions, IConvertResponse, IConvertTypeOption, IExtension, IExtensionContext, IExtensionInjectResult, IExtensionOptions (+8 more)

### Community 5 - "CommonJS CLI Rendering"
Cohesion: 0.06
Nodes (15): { Command, CommanderError, Option }, main(), { mdimg }, parseExtensions(), parseNumber(), pkg, program, u (+7 more)

### Community 6 - "ESM Rendering Plugins"
Cohesion: 0.08
Nodes (15): $, c(), l(), b(), d(), f(), g(), p (+7 more)

### Community 7 - "Package Public Contract"
Cohesion: 0.06
Nodes (30): author, description, exports, files, homepage, keywords, license, main (+22 more)

### Community 8 - "Documented Rendering Contracts"
Cohesion: 0.10
Nodes (17): Preview site deployment, Dependency build and release-age policy, Highlight.js syntax highlighting, Marked, MathJax SVG rendering, mdimg, Mermaid diagram rendering, Output processors (+9 more)

### Community 9 - "Core TypeScript Configuration"
Cohesion: 0.08
Nodes (23): compilerOptions, allowJs, allowSyntheticDefaultImports, checkJs, declaration, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+15 more)

### Community 10 - "Bundled Asset Build"
Cohesion: 0.17
Nodes (20): rollup, assertOfflineCss(), assertStandaloneScript(), assets, buildAssets(), cssUrls(), inlineCss(), listFiles() (+12 more)

### Community 11 - "Development Build Commands"
Cohesion: 0.11
Nodes (19): scripts, build, build:assets, build:sass, build:ts, lint, lint:fix, mdimg (+11 more)

### Community 12 - "Packed Consumer Checks"
Cohesion: 0.11
Nodes (15): { createRequire }, { dirname, isAbsolute, join, relative, resolve }, {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
}, { expectPng }, { findBrowser }, jestBin, metadata, nodePaths (+7 more)

### Community 13 - "Build Package Environment"
Cohesion: 0.13
Nodes (10): css, lib, require, rollupBin, rollupRoot, root, { createRequire }, jestRequire (+2 more)

### Community 14 - "Preview TypeScript Configuration"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, allowJs, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 15 - "Node Conversion Assertions"
Cohesion: 0.15
Nodes (13): expectMarkdown(), { execFileSync }, expectFile(), expectImage, { expectMarkdown, useImageAssertions }, { load }, { mdimg, createHtmlOutputProcessor, createImageOutputProcessor }, process() (+5 more)

### Community 16 - "DOM Validation Helpers"
Cohesion: 0.16
Nodes (12): cheerio, { execFileSync }, expectPdf(), { load }, puppeteer, { resolve }, useImageAssertions(), expectImage (+4 more)

### Community 17 - "Runtime Browser Verification"
Cohesion: 0.15
Nodes (8): evidence, network, output, { findBrowser }, fs, path, puppeteer, root

### Community 18 - "Preview Resource Manifest"
Cohesion: 0.19
Nodes (10): vite, createManifest(), importMap(), packages, projectRoot, externals, handler(), manifest (+2 more)

### Community 19 - "Plugin Hook Tests"
Cohesion: 0.14
Nodes (10): builtinsDisabled, code(), expectImage, { mdimg, createHtmlOutputProcessor }, { readFileSync, existsSync }, { resolve }, underlineMarkedExt, { useImageAssertions } (+2 more)

### Community 20 - "Temporary Workspace Tests"
Cohesion: 0.18
Nodes (8): { dirname, join }, { mkdtempSync, rmSync, writeFileSync }, { tmpdir }, useWorkspace(), { mdimg, createHtmlOutputProcessor }, { readdirSync, writeFileSync }, { useWorkspace }, workspace

### Community 21 - "JavaScript Rollup Bundling"
Cohesion: 0.20
Nodes (8): @rollup/plugin-babel, @rollup/plugin-commonjs, rollup-plugin-license, @rollup/plugin-node-resolve, @rollup/plugin-terser, rollup-plugin-typescript2, externalModules, pluginsArray

### Community 22 - "Offline Resource Tests"
Cohesion: 0.20
Nodes (9): typescript, assets, manifest, path, paths, { readFileSync }, repository, themeNames (+1 more)

### Community 23 - "HTML Template Tests"
Cohesion: 0.20
Nodes (9): expectImage, { expectMarkdown, useImageAssertions }, { load }, { mdimg, createImageOutputProcessor }, process(), { readFileSync, writeFileSync }, { resolve }, { useWorkspace } (+1 more)

### Community 24 - "JavaScript Lint Rules"
Cohesion: 0.22
Nodes (8): eslint, @eslint/js, eslint-plugin-prettier, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-simple-import-sort, globals, typescript-eslint

### Community 25 - "Public Package Types"
Cohesion: 0.22
Nodes (6): cache, { dirname, join, relative, resolve }, { execFileSync, spawnSync }, {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
}, repository, typesConsumer

### Community 26 - "Sass PDF Utilities"
Cohesion: 0.22
Nodes (4): pdfjs-dist, rollup-plugin-scss, requirePackage, task

### Community 27 - "Output Format Tests"
Cohesion: 0.22
Nodes (7): { existsSync, readFileSync, readdirSync }, expectImage, {
  expectMarkdown,
  expectPdf,
  useImageAssertions,
}, {
  mdimg,
  createHtmlOutputProcessor,
  createPdfOutputProcessor,
  createImageOutputProcessor,
}, { resolve }, { useWorkspace }, workspace

### Community 28 - "Safe File Writes"
Cohesion: 0.22
Nodes (7): { dirname, resolve }, failureCases, fs, { mdimg }, outputData, { useWorkspace }, workspace

### Community 29 - "Preview Source Tests"
Cohesion: 0.25
Nodes (5): { join, resolve }, { readFileSync, mkdtempSync, writeFileSync, rmSync }, { tmpdir }, ts, workspace

### Community 31 - "Runtime Library Dependencies"
Cohesion: 0.40
Nodes (5): dependencies, cheerio, commander, marked, puppeteer

### Community 32 - "Repository Metadata"
Cohesion: 0.67
Nodes (3): repository, type, url

## Knowledge Gaps
- **24 isolated node(s):** `@types/node`, `@babel/core`, `@babel/node`, `@babel/preset-env`, `@mathjax/mathjax-newcm-font` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 418 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Development Tool Dependencies` to `Package Public Contract`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **What connects `@types/node`, `@babel/core`, `@babel/node` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Markdown Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.09831029185867896 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `Core Markdown Rendering` to `Published Type Declarations`, `CommonJS CLI Rendering`, `ESM Rendering Plugins`, `Package Public Contract`, `Runtime Browser Verification`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Browser Preview Editor` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Why does `cheerio` connect `DOM Validation Helpers` to `Core Markdown Rendering`, `CLI Offline Acceptance`, `CommonJS CLI Rendering`, `ESM Rendering Plugins`, `Package Public Contract`, `Node Conversion Assertions`, `HTML Template Tests`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `CLI Offline Acceptance` be split into smaller, more focused modules?**
  _Cohesion score 0.056429232192414434 - nodes in this community are weakly interconnected._
## Scope and evidence

Third-party code in `lib/assets/` and preview images were excluded at the user's request. Only file types supported by graphify were scanned. The graph describes the current working tree, including uncommitted changes.

The AST extractor reported a syntax error in `test/offline.test.js` near line 23 and extracted 11 symbols from that file; coverage there may be partial. This is an extractor diagnostic, not a JavaScript runtime test result. It also reported 25 files without modeled symbols, including configuration and declaration files.

Semantic extraction used a host subagent. Exact token usage was unavailable, so zero counters indicate unavailable usage rather than free extraction. Structural edges came from deterministic AST extraction; semantic relationships retain their evidence confidence.

Graph integrity details are retained in `diagnostics.json`. The default undirected graph can combine several relations between the same two endpoints; compare the extraction edge count and unique graph edge count when interpreting the health diagnostics.

`graphify-out/` was written into the working tree. Unless ignored by the repository, it appears in `git status`; review generated outputs before committing them.

Health diagnostics: 11 dangling-endpoint relationships, 19 self-loop relationships, and 70 relationships combined by the undirected view. These diagnostics indicate that the graph should not be treated as a complete call graph.

## Verification

The exported JSON contains 694 unique node IDs, 1,088 edges, and 48 named communities. Every exported edge endpoint resolves to an exported node. The manifest contains no files from the excluded directories or excluded image fixture. All three inline viewer scripts passed JavaScript syntax parsing.

The HTML viewer loads vis-network from unpkg and requires network access for that script. The local HTTP preview tab was queued in Codex, but the sandbox blocked socket access during the HTTP check; browser interactions were not verified. Project builds and test suites were not run for this graph-generation task.
