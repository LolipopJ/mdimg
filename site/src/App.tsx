import { useCallback, useEffect, useRef, useState } from "react";
import manifest from "virtual:site-manifest";

import type { Config } from "./config";
import { defaults, documentFilename, renderKey } from "./config";
import { ConfigPanel } from "./ConfigPanel";
import type { FrameApi } from "./frame";
import { PreviewFrame } from "./PreviewFrame";
import { resourceUrl } from "./resources";

export function App() {
  const [config, setConfig] = useState(defaults);
  const [expanded, setExpanded] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [sourceAttempt, setSourceAttempt] = useState(0);
  const [source, setSource] = useState<{
    filename: string;
    markdown: string;
    draft: string;
    error: string;
  }>({ filename: "", markdown: "", draft: "", error: "" });
  const editTimer = useRef<number | undefined>(undefined);
  const filename = documentFilename(config.cssTemplate);
  const sourceReady = source.filename === filename && !source.error;
  useEffect(() => {
    const controller = new AbortController();
    const url = resourceUrl(filename);
    void fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Failed to load: ${url} (${response.status})`);
        const markdown = await response.text();
        if (!controller.signal.aborted)
          setSource({ filename, markdown, draft: markdown, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSource({
            filename,
            markdown: "",
            draft: "",
            error: error instanceof Error ? error.message : String(error),
          });
      });
    return () => {
      controller.abort();
      window.clearTimeout(editTimer.current);
    };
  }, [filename, sourceAttempt]);
  const [ready, setReady] = useState<{ api: FrameApi; key: string } | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    message: string;
    key: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const key = renderKey(config, source.markdown);
  const sourceError = source.filename === filename ? source.error : "";
  const status = exporting
    ? "exporting"
    : sourceError
      ? "error"
      : !sourceReady || source.draft !== source.markdown
        ? "loading"
        : failure?.key === key
          ? "error"
          : ready?.key === key
            ? "ready"
            : "loading";
  const onReady = useCallback((api: FrameApi, render: string) => {
    setReady({ api, key: render });
    setFailure(null);
  }, []);
  const onError = useCallback((message: string, render: string) => {
    setFailure({ message, key: render });
    setReady(null);
  }, []);
  const change = useCallback((next: Config) => {
    setConfig(next);
    setExportError("");
    setDownloadMessage("");
  }, []);
  const edit = (draft: string) => {
    setSource((current) => ({ ...current, draft }));
    setExportError("");
    setDownloadMessage("");
    window.clearTimeout(editTimer.current);
    editTimer.current = window.setTimeout(
      () =>
        setSource((current) =>
          current.filename === filename
            ? { ...current, markdown: draft }
            : current,
        ),
      300,
    );
  };
  const collapse = () => {
    setExpanded(false);
    toggle.current?.focus();
  };

  const download = async () => {
    if (status !== "ready" || !ready || ready.key !== key) return;
    setExporting(true);
    setExportError("");
    setDownloadMessage("");
    let url: string | undefined;
    try {
      const blob = await ready.api.exportImage(config);
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mdimg-${config.cssTemplate}.${config.type}`;
      document.body.append(link);
      link.click();
      link.remove();
      // Allow the browser to consume the object URL before releasing it.
      const downloadUrl = url;
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      url = undefined;
      setDownloadMessage("Full article image downloaded.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
      // Recreate the export runtime: html-to-image caches failed font/image requests.
      setReady(null);
      setAttempt((value) => value + 1);
    } finally {
      if (url) URL.revokeObjectURL(url);
      setExporting(false);
    }
  };

  return (
    <div className={`app ${expanded ? "panel-open" : "panel-closed"}`}>
      <a className="skip-link" href="#config-panel">
        Skip to settings
      </a>
      <header className="site-header">
        <a className="wordmark" href={import.meta.env.BASE_URL}>
          <code>mdimg</code>
        </a>
        <a
          className="github-link"
          href="https://github.com/LolipopJ/mdimg"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>
      <main className="preview-area" aria-label="Article preview">
        <div className="preview-caption">
          <h1>Convert Markdown to an image</h1>
          <span>
            {config.width} CSS px · Theme <code>{config.cssTemplate}</code>
          </span>
        </div>
        <div className="preview-window" aria-busy={status === "loading"}>
          {sourceReady && (
            <PreviewFrame
              renderConfig={key}
              width={config.width}
              attempt={attempt}
              onReady={onReady}
              onError={onError}
              loading={status === "loading"}
            />
          )}
          {status === "loading" && (
            <div className="preview-loading" role="status">
              <span className="preview-spinner" aria-hidden="true" />
              <span>Loading preview…</span>
            </div>
          )}
        </div>
        <p className="preview-note">
          Downloads include the full article, its background and decorations.
          Browser fonts and layout may differ from Puppeteer.
        </p>
      </main>
      <aside
        className="config-panel"
        aria-label="Preview settings"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !exporting) {
            event.preventDefault();
            collapse();
          }
        }}
      >
        <button
          className="panel-toggle"
          ref={toggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="config-panel"
          disabled={exporting}
          onClick={() => (expanded ? collapse() : setExpanded(true))}
        >
          <span>Preview settings</span>
          <span>{expanded ? "Collapse −" : "Expand +"}</span>
        </button>
        <div id="config-panel" hidden={!expanded}>
          <ConfigPanel
            config={config}
            onChange={change}
            manifest={manifest}
            markdown={sourceReady ? source.draft : ""}
            sourceReady={sourceReady}
            onMarkdownChange={edit}
            status={status}
            error={sourceError || (failure?.key === key ? failure.message : "")}
            exportError={exportError}
            downloadMessage={downloadMessage}
            onDownload={download}
            onReset={() => {
              change({ ...defaults });
              setReady(null);
              setFailure(null);
              setAttempt((value) => value + 1);
              if (sourceError) setSourceAttempt((value) => value + 1);
            }}
            onRetry={() => {
              if (sourceError) {
                setSourceAttempt((value) => value + 1);
                return;
              }
              setReady(null);
              setFailure(null);
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      </aside>
    </div>
  );
}
