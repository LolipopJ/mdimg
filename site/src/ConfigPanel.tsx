import { useEffect, useState } from "react";

import type { Shell } from "./commands";
import { createCalls } from "./commands";
import type { Config, Manifest } from "./config";
import { defaults, integerError } from "./config";

type Props = {
  config: Config;
  manifest: Manifest;
  onChange: (config: Config) => void;
  markdown: string;
  sourceReady: boolean;
  onMarkdownChange: (markdown: string) => void;
  status: "loading" | "ready" | "exporting" | "error";
  error: string;
  exportError: string;
  downloadMessage: string;
  onDownload: () => void;
  onRetry: () => void;
  onReset: () => void;
};

export function ConfigPanel({
  config,
  manifest,
  onChange,
  markdown,
  sourceReady,
  onMarkdownChange,
  status,
  error,
  exportError,
  downloadMessage,
  onDownload,
  onRetry,
  onReset,
}: Props) {
  const [width, setWidth] = useState(String(config.width));
  const [quality, setQuality] = useState(String(config.quality));
  const [tab, setTab] = useState<"cli" | "node">("cli");
  const [shell, setShell] = useState<Shell>("posix");
  const [copyMessage, setCopyMessage] = useState("");
  const widthError = integerError(width, 1);
  const qualityError = integerError(quality, 0, 100);
  const html = manifest.templates.find(
    (template) => template.name === config.cssTemplate,
  )!.html;
  const calls = createCalls(config, html, shell);
  const locked = status === "exporting";
  const invalid = !!widthError || (config.type !== "png" && !!qualityError);
  const set = <K extends keyof Config>(name: K, value: Config[K]) =>
    onChange({ ...config, [name]: value });
  useEffect(() => {
    if (widthError || Number(width) === config.width || locked) return;
    const timeout = setTimeout(
      () => onChange({ ...config, width: Number(width) }),
      150,
    );
    return () => clearTimeout(timeout);
  }, [width, widthError, config, onChange, locked]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        tab === "cli" ? calls.cli : calls.node,
      );
      setCopyMessage("Copied.");
    } catch {
      setCopyMessage("Copy failed. Select the code below to copy it manually.");
    }
  };
  const statusText = {
    loading: "Loading resources and updating preview…",
    ready: "Preview ready",
    exporting: "Exporting the full article…",
    error: "Preview failed. Settings have not been applied.",
  }[status];

  return (
    <>
      <div className="export-actions">
        <div className={`status status-${status}`} role="status">
          <span aria-hidden="true" />
          {statusText}
        </div>
        <button
          className="primary"
          type="button"
          onClick={onDownload}
          disabled={
            status !== "ready" || invalid || Number(width) !== config.width
          }
        >
          {locked ? "Exporting…" : "Download full article"}
        </button>
        <button
          className="reset"
          type="button"
          disabled={locked}
          onClick={() => {
            setWidth(String(defaults.width));
            setQuality(String(defaults.quality));
            setCopyMessage("");
            onReset();
          }}
        >
          Reset settings
        </button>
        {error && (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>
              Retry loading
            </button>
          </div>
        )}
        {exportError && (
          <p className="field-error" role="alert">
            {exportError}
          </p>
        )}
        {downloadMessage && (
          <p className="success" role="status">
            {downloadMessage}
          </p>
        )}
      </div>
      <div className="panel-scroll">
        <fieldset disabled={locked || !sourceReady}>
          <legend>Document</legend>
          <label htmlFor="document-editor">Edit Markdown or HTML</label>
          <textarea
            id="document-editor"
            value={markdown}
            onChange={(event) => onMarkdownChange(event.target.value)}
            rows={8}
            spellCheck={false}
          />
        </fieldset>
        <fieldset disabled={locked}>
          <legend>Appearance</legend>
          <label htmlFor="template">Style template</label>
          <select
            id="template"
            value={config.cssTemplate}
            onChange={(event) => set("cssTemplate", event.target.value)}
          >
            {manifest.templates.map((template) => (
              <option key={template.name}>{template.name}</option>
            ))}
          </select>
          <p className="hint">
            HTML template: <code>{html}</code>
          </p>
          <label htmlFor="width">
            Render width <span>CSS px</span>
          </label>
          <input
            id="width"
            type="number"
            min="1"
            step="1"
            value={width}
            aria-invalid={!!widthError}
            aria-describedby={widthError ? "width-error" : undefined}
            onChange={(event) => setWidth(event.target.value)}
          />
          {widthError && (
            <p id="width-error" className="field-error">
              {widthError} The last valid preview is kept.
            </p>
          )}
          <label htmlFor="theme">Base theme</label>
          <select
            id="theme"
            value={config.theme}
            onChange={(event) =>
              set("theme", event.target.value as Config["theme"])
            }
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p className="hint">
            Sets the base mdimg theme. The choices below override each
            extension. Article colors come from the template.
          </p>
        </fieldset>
        <fieldset disabled={locked}>
          <legend>Rendering</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={config.highlightJs}
              onChange={(event) => set("highlightJs", event.target.checked)}
            />
            Syntax highlighting
          </label>
          <label htmlFor="highlight-theme">Highlight theme</label>
          <select
            id="highlight-theme"
            disabled={!config.highlightJs}
            value={config.highlightTheme}
            onChange={(event) =>
              set(
                "highlightTheme",
                event.target.value as Config["highlightTheme"],
              )
            }
          >
            {manifest.highlightThemes.map((theme) => (
              <option key={theme}>{theme}</option>
            ))}
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={config.mathJax}
              onChange={(event) => set("mathJax", event.target.checked)}
            />
            Math formulas
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={config.mermaid}
              onChange={(event) => set("mermaid", event.target.checked)}
            />
            Mermaid diagrams
          </label>
          <label htmlFor="mermaid-theme">Diagram theme</label>
          <select
            id="mermaid-theme"
            disabled={!config.mermaid}
            value={config.mermaidTheme}
            onChange={(event) =>
              set("mermaidTheme", event.target.value as Config["mermaidTheme"])
            }
          >
            {manifest.mermaidThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset disabled={locked}>
          <legend>Export</legend>
          <label htmlFor="format">Image format</label>
          <select
            id="format"
            value={config.type}
            onChange={(event) =>
              set("type", event.target.value as Config["type"])
            }
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
          {config.type !== "png" && (
            <>
              <label htmlFor="quality">
                Image quality <span>0–100</span>
              </label>
              <input
                id="quality"
                type="number"
                min="0"
                max="100"
                step="1"
                value={quality}
                aria-invalid={!!qualityError}
                aria-describedby={qualityError ? "quality-error" : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuality(value);
                  if (!integerError(value, 0, 100))
                    set("quality", Number(value));
                }}
              />
              {qualityError && (
                <p id="quality-error" className="field-error">
                  {qualityError} Calls retain the last valid value.
                </p>
              )}
            </>
          )}
          <p className="hint">
            Full article height · Pixel ratio 1
            {config.type === "jpeg"
              ? " · Transparent backgrounds use white"
              : ""}
          </p>
        </fieldset>
        <section className="calls" aria-labelledby="calls-heading">
          <h2 id="calls-heading">Use in your project</h2>
          <div className="tabs" role="tablist" aria-label="Code examples">
            {(["cli", "node"] as const).map((item) => (
              <button
                type="button"
                role="tab"
                id={`tab-${item}`}
                aria-selected={tab === item}
                aria-controls="call-code"
                tabIndex={tab === item ? 0 : -1}
                key={item}
                onClick={() => {
                  setTab(item);
                  setCopyMessage("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    const next = item === "cli" ? "node" : "cli";
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
              >
                {item === "cli" ? "CLI" : "Node.js"}
              </button>
            ))}
          </div>
          {tab === "cli" && (
            <>
              <label htmlFor="shell">Shell</label>
              <select
                id="shell"
                value={shell}
                onChange={(event) => {
                  setShell(event.target.value as Shell);
                  setCopyMessage("");
                }}
              >
                <option value="posix">POSIX (Bash / Zsh)</option>
                <option value="powershell">PowerShell 7</option>
              </select>
            </>
          )}
          <pre
            id="call-code"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
          >
            <code>{tab === "cli" ? calls.cli : calls.node}</code>
          </pre>
          <button className="copy" type="button" onClick={copy}>
            Copy {tab === "cli" ? "CLI" : "Node.js"}
          </button>
          <span className="copy-status" role="status">
            {copyMessage}
          </span>
          <p className="hint">
            Install a matching mdimg version. Save your edited Markdown as{" "}
            <code>path/to/file.md</code> and keep its relative images alongside
            it. New source templates may not be published on npm yet.
          </p>
          <p className="version">
            mdimg {manifest.packageVersion} ·{" "}
            <a
              href={`https://github.com/LolipopJ/mdimg/tree/${manifest.commit}`}
              target="_blank"
              rel="noreferrer"
              title={manifest.commit}
            >
              {manifest.commit.slice(0, 7)}
            </a>{" "}
            · {manifest.templates.length} templates
          </p>
        </section>
      </div>
    </>
  );
}
