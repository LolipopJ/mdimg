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
export type IConvertTypeOption = NonNullable<
  import("puppeteer").ScreenshotOptions["type"]
>;

/** Encode type of output image */
export type IConvertEncodingOption = NonNullable<
  import("puppeteer").ScreenshotOptions["encoding"] | "blob"
>;

export interface IExtensionOptions {
  /**
   * Provide a boolean value of a configuration object for `hljs.configure()`.
   * Available options: https://highlightjs.readthedocs.io/en/latest/api.html#configure
   * @link https://github.com/highlightjs/highlight.js
   * @defaultValue `true`
   */
  highlightJs?:
    | boolean
    | {
        /**
         * Follow global `theme` option by default.
         * Available themes: https://highlightjs.org/demo
         */
        theme?: string;
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
   * Suppress any registered extension (built-in or plugin-contributed) by setting its name to `false`.
   * This is the single mechanism for opting out of a named extension at the call-site level.
   * Plugin-contributed extensions receive their configuration at registration time (inside the plugin itself).
   * @example `{ "mermaid": false, "myCustomExt": false }`
   */
  [name: string]: boolean | Record<string, unknown> | undefined;
}

// ─── Extension Framework ──────────────────────────────────────────────────────

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
  inject(
    context: IExtensionContext,
  ): IExtensionInjectResult | Promise<IExtensionInjectResult>;
}

// ─── Plugin / Hook System ─────────────────────────────────────────────────────

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
  afterRender?: (
    result: IConvertResponse,
  ) => IConvertResponse | Promise<IConvertResponse>;
}

/** A plugin bundles lifecycle hooks and/or custom extensions */
export interface IPlugin {
  /** Unique name identifying this plugin */
  name: string;
  /** Lifecycle hooks to tap into the conversion pipeline */
  hooks?: IHooks;
  /** Custom extensions to inject into every rendered page */
  extensions?: IExtension[];
}
