import type { MermaidConfig } from "mermaid";

import type {
  IConvertOptions,
  IHighlightJsTheme,
} from "../../src/interfaces/index";

export type Config = Required<
  Pick<IConvertOptions, "cssTemplate" | "width" | "theme" | "type" | "quality">
> & {
  highlightJs: boolean;
  highlightTheme: IHighlightJsTheme;
  mathJax: boolean;
  mermaid: boolean;
  mermaidTheme: NonNullable<MermaidConfig["theme"]>;
};

export const defaults: Config = {
  cssTemplate: "github",
  width: 800,
  theme: "light",
  type: "png",
  quality: 100,
  highlightJs: true,
  highlightTheme: "github",
  mathJax: true,
  mermaid: true,
  mermaidTheme: "default",
};

export function integerError(
  value: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): string | null {
  const number = Number(value);
  return value.trim() &&
    Number.isSafeInteger(number) &&
    number >= min &&
    number <= max
    ? null
    : `Enter a whole number from ${min} to ${max}.`;
}

export function renderKey(config: Config, markdown: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type: _type, quality: _quality, ...render } = config;
  return JSON.stringify({ ...render, markdown });
}

export type Manifest = {
  commit: string;
  packageVersion: string;
  assetBase: string;
  templates: { name: string; html: string }[];
  highlightThemes: string[];
  mermaidThemes: Config["mermaidTheme"][];
  versions: Record<string, string>;
};

export function documentFilename(template: string): string {
  return template === "words" ? "test-template-words.md" : "test.md";
}
