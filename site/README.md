# mdimg Preview

A static Markdown editor and preview tool. Choose committed mdimg templates, configure rendering, download complete PNG/JPEG/WebP images, and copy CLI or Node.js calls.

```sh
pnpm install --frozen-lockfile
pnpm run site:dev
pnpm run site:typecheck
pnpm run site:test --runInBand
pnpm run site:build
pnpm run site:preview
```

Open `/mdimg/`. Production files are written to `site/dist/`. Set `PAGES_BASE_PATH` to use another Pages path; Actions reads this from the Pages configuration.

The editor loads test.md from https://raw.githubusercontent.com/LolipopJ/mdimg/main/test/static/. The words template loads test-template-words.md from the same remote directory. Relative image and document URLs become explicit GitHub URLs; local file URLs are rejected, with no local resource lookup or fallback. Switching to or from words loads the matching sample; other template changes preserve edits. Editing uses a 300 ms debounce and width changes a 150 ms debounce. CLI and Node.js examples still use local input files.

Highlight themes come from every stylesheet shipped with the installed highlight.js version, including `base16/`; there is no automatic choice. Diagram themes come from Mermaid's registered built-in themes, including the neo and redux families in Mermaid 12. Both choices are explicit in generated calls. Formatting and quality changes update export settings without rerendering the document.

The build pins template resources to `GITHUB_SHA` (HEAD locally) and includes only CSS/HTML present in that commit. Commit compiled CSS before deploying new templates; uncommitted templates cannot be fetched from GitHub CDN. Third-party runtimes stay external in both development and production. Their exact versions come from the root lockfile and load through esm.sh/jsDelivr. Resources must support CORS. Failures display the affected resource and a retry action.

The same-origin iframe isolates article styles and extension state from the controls. Edited HTML is sanitized with DOMPurify before insertion; scripts, event handlers and active embedded documents are removed. Each update creates a new iframe; stale results cannot enable export.

Downloads capture the complete `#mdimg-body`, including SVG formulas, diagrams, backgrounds and decorations. Pixel ratio is fixed at 1. PNG/WebP preserve transparency; JPEG uses the article background, or white when fully transparent. MIME and decoded dimensions are checked. Exceeding browser canvas or memory limits produces an error instead of silently resizing or truncating.

For actual Chromium verification, build first, then run:

```sh
node site/verify.mjs
```

Set `PUPPETEER_EXECUTABLE_PATH` to use an installed browser. The script starts its own preview server on port 4174 and checks decoded image dimensions, bottom diagram pixels, editor debounce, sanitation, themes, failure recovery and narrow-screen keyboard access. Screenshots, images and network evidence are saved under `mdimg_output/site/`.

Use a modern browser supporting import maps, SVG foreignObject, FontFaceSet and createImageBitmap. Other browser engines require their own verification; DOM export does not guarantee pixel equivalence with Puppeteer. Calls require a matching local mdimg version; templates available in source may not yet be published on npm.

`.github/workflows/pages.yml` builds and deploys on relevant main-branch changes or a manual trigger. Enable GitHub Pages with GitHub Actions as its source. The workflow builds the site and does not run consumer tests.

A loading overlay covers the preview during document loading and rendering. Reset settings restores every configuration field and clears invalid numeric inputs; edits are preserved when the document source stays the same.
