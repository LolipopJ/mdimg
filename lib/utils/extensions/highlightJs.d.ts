import type { IExtension } from "../../interfaces";
export declare const createHighlightJsExtension: (config: boolean | {
    theme?: string;
    [key: string]: unknown;
}) => IExtension;
