import type { IExtension, IHighlightJsTheme } from "../interfaces";
export declare const createHighlightJsExtension: (config: boolean | {
    theme?: IHighlightJsTheme;
    [key: string]: unknown;
}) => IExtension;
