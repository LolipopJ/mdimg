import type { MermaidConfig } from "mermaid";
import type { IHighlightJsTheme } from "../interfaces";
export declare function getDefaultThemes(cssTemplate: string): {
    highlightJs: IHighlightJsTheme;
    mermaid: NonNullable<MermaidConfig["theme"]>;
};
