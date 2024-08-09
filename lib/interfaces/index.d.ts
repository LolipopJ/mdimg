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
     * Width of output image
     * @defaultValue `800`
     */
    width?: number;
    /**
     * Height of output image
     * @defaultValue `600`
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
    htmlTemplate?: "default" | "words";
    /**
     * CSS rendering template. This option has no effect if `cssText` is specified
     * @defaultValue `default`
     */
    cssTemplate?: "default" | "empty" | "github" | "githubDark" | "words";
    /**
     * Show preset console log
     * @defaultValue `false`
     */
    log?: boolean;
    /** Launch options of Puppeteer. More info: https://pptr.dev/api/puppeteer.puppeteerlaunchoptions */
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
