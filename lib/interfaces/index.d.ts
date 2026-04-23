export interface IConvertOptions {
    /** Markdown or HTML text. This option has no effect if `inputFilename` is specified */
    inputText?: string;
    /** Filename of source Markdown or HTML */
    inputFilename?: string;
    /** @deprecated: rename to `inputText` */
    mdText?: string;
    /** @deprecated: rename to `inputFilename` */
    mdFile?: string;
    /** Output binary image filename. File type can be `jpeg`, `png` or `webp`. Available when `encoding: "binary"` */
    outputFilename?: import("puppeteer").ScreenshotOptions["path"];
    /**
     * File type of output image. Type will be inferred from `outputFilename` if set
     * @defaultValue `png`
     */
    type?: IConvertTypeOption;
    /**
     * Width in pixel of output image
     * @defaultValue `800`
     */
    width?: number;
    /**
     * Min-height in pixel of output image. Should be a number >= 100
     * @defaultValue `100`
     */
    height?: number;
    /**
     * Encoding of output image
     * @defaultValue `binary`
     */
    encoding?: IConvertEncodingOption;
    /**
     * Quality of the image, between 0-100. Not applicable to `png` images.
     * @defaultValue `100`
     */
    quality?: import("puppeteer").ScreenshotOptions["quality"];
    /** HTML rendering text */
    htmlText?: string;
    /** CSS rendering text */
    cssText?: string;
    /**
     * HTML rendering template. This option has no effect if `htmlText` is specified
     * @defaultValue `default`
     */
    htmlTemplate?: string;
    /**
     * CSS rendering template. This option has no effect if `cssText` is specified
     * @defaultValue `default`
     */
    cssTemplate?: string;
    /**
     * Rendering color theme
     * @defaultValue `light`
     */
    theme?: "light" | "dark";
    /**
     * Configuration for third-party extensions
     */
    extensions: boolean | IExtensionOptions;
    /**
     * List of plugins to apply during the conversion pipeline.
     * Each plugin may provide lifecycle hooks and/or custom extensions.
     */
    plugins?: IPlugin[];
    /**
     * Custom output processor. Overrides the built-in Puppeteer screenshot logic.
     *
     * Use the built-in factories from `mdimg`:
     * ```ts
     * import { createPdfOutputProcessor, createHtmlOutputProcessor } from 'mdimg';
     *
     * // With explicit outputFilename → written to disk
     * await mdimg({ outputProcessor: createPdfOutputProcessor(), outputFilename: 'out.pdf', ... });
     *
     * // Without outputFilename → result returned in-memory only (result.data)
     * const { data } = await mdimg({ outputProcessor: createHtmlOutputProcessor(), ... });
     * ```
     *
     * When not set, defaults to an image (PNG/JPEG/WebP) processor driven by the
     * `type`, `encoding`, and `quality` options.
     *
     * **Disk-write semantics for custom processors**: a file is written **only**
     * when `outputFilename` is explicitly provided. No default output path is
     * generated for custom processors.
     */
    outputProcessor?: IOutputProcessor;
    /**
     * Show preset console log
     * @defaultValue `false`
     */
    log?: boolean;
    /**
     * If true, temporary HTML file will be kept after rendering.
     * You can find the hidden temporary files in the folder where the input file is located or the script is executed.
     * @defaultValue `false`
     */
    debug?: boolean;
    /**
     * Launch options of Puppeteer
     * @link https://pptr.dev/api/puppeteer.puppeteerlaunchoptions */
    puppeteerProps?: import("puppeteer").LaunchOptions;
}
export type IConvertResponse = {
    /** Rendered HTML document */
    html: string;
    /** Uint8Array of output image when `encoding: "binary"`, or BASE64 encoded string of output image `encoding: "base64"` */
    data: Uint8Array | string;
    /** Path of output image when `encoding: "binary"` */
    path?: string;
};
/** File type of output image */
export type IConvertTypeOption = NonNullable<import("puppeteer").ScreenshotOptions["type"]>;
/** Encode type of output image */
export type IConvertEncodingOption = NonNullable<import("puppeteer").ScreenshotOptions["encoding"] | "blob">;
/**
 * Runtime context supplied to `IOutputProcessor.process()`.
 * Fields are populated based on whether the processor declares `requiresPage`.
 */
export interface IOutputProcessorContext {
    /** Complete rendered HTML document (after all plugin hooks). */
    html: string;
    /**
     * Active Puppeteer page.
     * Present only when `IOutputProcessor.requiresPage !== false`.
     */
    page?: import("puppeteer").Page;
    /**
     * `ElementHandle` for the `#mdimg-body` element.
     * Present only when `page` is present.
     */
    body?: import("puppeteer").ElementHandle;
    /**
     * Resolved absolute output file path.
     * Present only when `outputFilename` was **explicitly provided** by the caller.
     * The processor may use this as a hint but does **not** need to write the file;
     * `mdimg` handles disk I/O after the processor returns.
     * When absent, the processor result is returned in-memory only.
     */
    outputPath?: string;
}
/**
 * Data payload returned by `IOutputProcessor.process()`.
 * `mdimg` writes this to disk when an output filename was resolved.
 */
export interface IOutputProcessorResult {
    /**
     * Output payload.
     * - `Uint8Array` for binary formats (images, PDF).
     * - `string` for text formats (HTML, SVG).
     */
    data: Uint8Array | string;
}
/**
 * An output processor transforms the rendered HTML (and optionally a live
 * Puppeteer page) into a specific output format.
 *
 * Built-in factories (all exported from `mdimg`):
 * - `createImageOutputProcessor()` — PNG / JPEG / WebP via Puppeteer screenshot (default)
 * - `createPdfOutputProcessor()` — PDF via `page.pdf()`
 * - `createHtmlOutputProcessor()` — raw HTML string, no browser required
 *
 * Custom processors can target any format — SVG, DOCX, plain text, etc.
 */
export interface IOutputProcessor {
    /**
     * Format identifier / typical file extension for this processor.
     * Examples: `"pdf"`, `"svg"`, `"html"`, `"png"`.
     */
    format: string;
    /**
     * Whether this processor needs an active Puppeteer page in the context.
     * Set to `false` for text-only formats (e.g. HTML export) to skip browser
     * launch entirely and improve performance.
     * @defaultValue `true`
     */
    requiresPage?: boolean;
    /** Produce the output from the provided context. */
    process(ctx: IOutputProcessorContext): Promise<IOutputProcessorResult>;
}
/**
 * All highlight.js theme names bundled with mdimg.
 * Top-level themes come from `@highlightjs/cdn-assets/styles/*.min.css`;
 * base16 variants are prefixed with `base16/`.
 * @see https://highlightjs.org/demo
 */
export type IHighlightJsTheme = "1c-light" | "a11y-dark" | "a11y-light" | "agate" | "an-old-hope" | "androidstudio" | "arduino-light" | "arta" | "ascetic" | "atom-one-dark-reasonable" | "atom-one-dark" | "atom-one-light" | "brown-paper" | "codepen-embed" | "color-brewer" | "cybertopia-cherry" | "cybertopia-dimmer" | "cybertopia-icecap" | "cybertopia-saturated" | "dark" | "default" | "devibeans" | "docco" | "far" | "felipec" | "foundation" | "github-dark-dimmed" | "github-dark" | "github" | "gml" | "googlecode" | "gradient-dark" | "gradient-light" | "grayscale" | "hybrid" | "idea" | "intellij-light" | "ir-black" | "isbl-editor-dark" | "isbl-editor-light" | "kimbie-dark" | "kimbie-light" | "lightfair" | "lioshi" | "magula" | "mono-blue" | "monokai-sublime" | "monokai" | "night-owl" | "nnfx-dark" | "nnfx-light" | "nord" | "obsidian" | "panda-syntax-dark" | "panda-syntax-light" | "paraiso-dark" | "paraiso-light" | "pojoaque" | "purebasic" | "qtcreator-dark" | "qtcreator-light" | "rainbow" | "rose-pine-dawn" | "rose-pine-moon" | "rose-pine" | "routeros" | "school-book" | "shades-of-purple" | "srcery" | "stackoverflow-dark" | "stackoverflow-light" | "sunburst" | "tokyo-night-dark" | "tokyo-night-light" | "tomorrow-night-blue" | "tomorrow-night-bright" | "vs" | "vs2015" | "xcode" | "xt256" | "base16/3024" | "base16/apathy" | "base16/apprentice" | "base16/ashes" | "base16/atelier-cave-light" | "base16/atelier-cave" | "base16/atelier-dune-light" | "base16/atelier-dune" | "base16/atelier-estuary-light" | "base16/atelier-estuary" | "base16/atelier-forest-light" | "base16/atelier-forest" | "base16/atelier-heath-light" | "base16/atelier-heath" | "base16/atelier-lakeside-light" | "base16/atelier-lakeside" | "base16/atelier-plateau-light" | "base16/atelier-plateau" | "base16/atelier-savanna-light" | "base16/atelier-savanna" | "base16/atelier-seaside-light" | "base16/atelier-seaside" | "base16/atelier-sulphurpool-light" | "base16/atelier-sulphurpool" | "base16/atlas" | "base16/bespin" | "base16/black-metal-bathory" | "base16/black-metal-burzum" | "base16/black-metal-dark-funeral" | "base16/black-metal-gorgoroth" | "base16/black-metal-immortal" | "base16/black-metal-khold" | "base16/black-metal-marduk" | "base16/black-metal-mayhem" | "base16/black-metal-nile" | "base16/black-metal-venom" | "base16/black-metal" | "base16/brewer" | "base16/bright" | "base16/brogrammer" | "base16/brush-trees-dark" | "base16/brush-trees" | "base16/chalk" | "base16/circus" | "base16/classic-dark" | "base16/classic-light" | "base16/codeschool" | "base16/colors" | "base16/cupcake" | "base16/cupertino" | "base16/danqing" | "base16/darcula" | "base16/dark-violet" | "base16/darkmoss" | "base16/darktooth" | "base16/decaf" | "base16/default-dark" | "base16/default-light" | "base16/dirtysea" | "base16/dracula" | "base16/edge-dark" | "base16/edge-light" | "base16/eighties" | "base16/embers" | "base16/equilibrium-dark" | "base16/equilibrium-gray-dark" | "base16/equilibrium-gray-light" | "base16/equilibrium-light" | "base16/espresso" | "base16/eva-dim" | "base16/eva" | "base16/flat" | "base16/framer" | "base16/fruit-soda" | "base16/gigavolt" | "base16/github" | "base16/google-dark" | "base16/google-light" | "base16/grayscale-dark" | "base16/grayscale-light" | "base16/green-screen" | "base16/gruvbox-dark-hard" | "base16/gruvbox-dark-medium" | "base16/gruvbox-dark-pale" | "base16/gruvbox-dark-soft" | "base16/gruvbox-light-hard" | "base16/gruvbox-light-medium" | "base16/gruvbox-light-soft" | "base16/hardcore" | "base16/harmonic16-dark" | "base16/harmonic16-light" | "base16/heetch-dark" | "base16/heetch-light" | "base16/helios" | "base16/hopscotch" | "base16/horizon-dark" | "base16/horizon-light" | "base16/humanoid-dark" | "base16/humanoid-light" | "base16/ia-dark" | "base16/ia-light" | "base16/icy-dark" | "base16/ir-black" | "base16/isotope" | "base16/kimber" | "base16/london-tube" | "base16/macintosh" | "base16/marrakesh" | "base16/materia" | "base16/material-darker" | "base16/material-lighter" | "base16/material-palenight" | "base16/material-vivid" | "base16/material" | "base16/mellow-purple" | "base16/mexico-light" | "base16/mocha" | "base16/monokai" | "base16/nebula" | "base16/nord" | "base16/nova" | "base16/ocean" | "base16/oceanicnext" | "base16/one-light" | "base16/onedark" | "base16/outrun-dark" | "base16/papercolor-dark" | "base16/papercolor-light" | "base16/paraiso" | "base16/pasque" | "base16/phd" | "base16/pico" | "base16/pop" | "base16/porple" | "base16/qualia" | "base16/railscasts" | "base16/rebecca" | "base16/ros-pine-dawn" | "base16/ros-pine-moon" | "base16/ros-pine" | "base16/sagelight" | "base16/sandcastle" | "base16/seti-ui" | "base16/shapeshifter" | "base16/silk-dark" | "base16/silk-light" | "base16/snazzy" | "base16/solar-flare-light" | "base16/solar-flare" | "base16/solarized-dark" | "base16/solarized-light" | "base16/spacemacs" | "base16/summercamp" | "base16/summerfruit-dark" | "base16/summerfruit-light" | "base16/synth-midnight-terminal-dark" | "base16/synth-midnight-terminal-light" | "base16/tango" | "base16/tender" | "base16/tomorrow-night" | "base16/tomorrow" | "base16/twilight" | "base16/unikitty-dark" | "base16/unikitty-light" | "base16/vulcan" | "base16/windows-10-light" | "base16/windows-10" | "base16/windows-95-light" | "base16/windows-95" | "base16/windows-high-contrast-light" | "base16/windows-high-contrast" | "base16/windows-nt-light" | "base16/windows-nt" | "base16/woodland" | "base16/xcode-dusk" | "base16/zenburn";
export interface IExtensionOptions {
    /**
     * Provide a boolean value of a configuration object for `hljs.configure()`.
     * Available options: https://highlightjs.readthedocs.io/en/latest/api.html#configure
     * @link https://github.com/highlightjs/highlight.js
     * @defaultValue `true`
     */
    highlightJs?: boolean | {
        /**
         * Highlight.js theme name. Defaults to `atom-one-light` / `atom-one-dark`
         * based on the global `theme` option when not set.
         * Independent of the global theme — setting this overrides the automatic selection.
         */
        theme?: IHighlightJsTheme;
        [key: string]: unknown;
    };
    /**
     * Provide a boolean value of a configuration object.
     * Available options: https://docs.mathjax.org/en/latest/options/index.html
     * @link https://github.com/mathjax/MathJax
     * @defaultValue `true`
     */
    mathJax?: boolean | Record<string, unknown>;
    /**
     * Provide a boolean value of a configuration object.
     * Available options: https://mermaid.js.org/config/schema-docs/config.html
     * @link https://github.com/mermaid-js/mermaid
     * @defaultValue `true`
     */
    mermaid?: boolean | Record<string, unknown>;
    /**
     * Suppress any extension (built-in or plugin-contributed) or entire plugin
     * by setting its name to `false`.
     *
     * **By extension name** — removes that `IExtension` from injection AND suppresses
     * `markedExtensions` of the plugin that owns it, preventing a half-enabled
     * state where resources are gone but custom parsing still runs:
     * ```ts
     * extensions: { mermaid: false, myExt: false }
     * ```
     *
     * **By plugin name** — suppresses all `IExtension` entries the plugin registered
     * AND its `markedExtensions` in a single key:
     * ```ts
     * extensions: { myPlugin: false }
     * ```
     *
     * Both forms reach the same result for a plugin that contributes both
     * injection and custom parsing.
     */
    [name: string]: boolean | Record<string, unknown> | undefined;
}
/** Runtime context passed to an extension's `inject` method */
export interface IExtensionContext {
    /** Current rendering theme */
    theme: "light" | "dark";
}
/** HTML fragments returned by an extension to be injected into the page */
export interface IExtensionInjectResult {
    /** HTML fragment appended to `<head>` */
    head?: string;
    /** HTML fragment appended to `<body>` */
    body?: string;
}
/** Interface every extension (built-in or custom) must implement */
export interface IExtension {
    /** Unique name identifying this extension */
    name: string;
    /** Produce HTML/CSS/JS fragments to inject into the rendered page */
    inject(context: IExtensionContext): IExtensionInjectResult | Promise<IExtensionInjectResult>;
}
/** Lifecycle hooks available in the conversion pipeline */
export interface IHooks {
    /**
     * Transform the raw input text **before** Markdown parsing.
     * Receives the original Markdown/HTML string and must return the (optionally modified) string.
     */
    beforeParse?: (text: string) => string | Promise<string>;
    /**
     * Transform the parsed HTML **after** Markdown parsing but before the HTML template is spliced.
     * Receives the rendered HTML fragment and must return the (optionally modified) string.
     */
    afterParse?: (html: string) => string | Promise<string>;
    /**
     * Transform the final HTML document **after** template splicing and extension injection.
     * Receives the complete HTML document string and must return the (optionally modified) string.
     */
    afterSplice?: (html: string) => string | Promise<string>;
    /**
     * Transform the conversion result **after** Puppeteer rendering.
     * Receives the `IConvertResponse` and must return the (optionally modified) response.
     */
    afterRender?: (result: IConvertResponse) => IConvertResponse | Promise<IConvertResponse>;
}
/** A plugin bundles lifecycle hooks and/or custom extensions */
export interface IPlugin {
    /** Unique name identifying this plugin */
    name: string;
    /** Lifecycle hooks to tap into the conversion pipeline */
    hooks?: IHooks;
    /** Custom extensions to inject into every rendered page */
    extensions?: IExtension[];
    /**
     * Custom marked extensions applied during Markdown parsing.
     * Each item is passed to `marked.use()` in registration order, allowing
     * you to add custom syntax (block/inline rules), override renderers, or
     * attach `walkTokens` logic.
     * @see https://marked.js.org/using_pro#extensions
     */
    markedExtensions?: import("marked").MarkedExtension[];
}
