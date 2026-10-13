import type { MermaidConfig } from "mermaid";

import type { IHighlightJsTheme } from "../interfaces";

const darkTemplates = new Set([
  "binance",
  "bmw-m",
  "claude",
  "githubDark",
  "midnight",
  "playstation",
  "replicate",
  "sentry",
  "spacex",
  "vercel",
  "x.ai",
]);

export function getDefaultThemes(cssTemplate: string): {
  highlightJs: IHighlightJsTheme;
  mermaid: NonNullable<MermaidConfig["theme"]>;
} {
  const name = cssTemplate
    .split(/[\\/]/)
    .pop()!
    .replace(/\.css$/, "");
  const dark = darkTemplates.has(name);
  return {
    highlightJs: dark ? "atom-one-dark" : "atom-one-light",
    mermaid: dark ? "dark" : "default",
  };
}
