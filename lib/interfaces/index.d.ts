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
    outputFilename?: string;
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
export interface IExtensionOptions {
    /**
     * Provide a boolean value of a configuration object for `hljs.configure()`.
     * Available options: https://highlightjs.readthedocs.io/en/latest/api.html#configure
     * @link https://github.com/highlightjs/highlight.js
     * @defaultValue `true`
     */
    highlightJs?: boolean | {
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
}
