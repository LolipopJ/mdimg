import { useEffect, useRef } from "react";

import type { FrameApi } from "./frame";

type Props = {
  renderConfig: string;
  width: number;
  attempt: number;
  loading: boolean;
  onReady: (api: FrameApi, key: string) => void;
  onError: (message: string, key: string) => void;
};

export function PreviewFrame({
  renderConfig,
  width,
  attempt,
  loading,
  onReady,
  onError,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const frame = document.createElement("iframe");
    frame.title = "Full article preview";
    frame.style.width = `${width}px`;
    const url = new URL(
      `${import.meta.env.BASE_URL}frame.html`,
      location.origin,
    );
    frame.src = url.href;
    const timeout = setTimeout(() => {
      if (active)
        onError(
          "Preview timed out. Check the CDN connection and retry.",
          renderConfig,
        );
    }, 65000);
    frame.onload = async () => {
      try {
        const api = frame.contentWindow?.mdimgPreview;
        if (!api)
          throw new Error(
            "Preview runtime failed to load. Check the CDN connection and retry.",
          );
        api.start(JSON.parse(renderConfig));
        await api.ready;
        if (active) onReady(api, renderConfig);
      } catch (error) {
        if (active)
          onError(
            error instanceof Error ? error.message : String(error),
            renderConfig,
          );
      } finally {
        clearTimeout(timeout);
      }
    };
    host.current!.append(frame);
    return () => {
      active = false;
      clearTimeout(timeout);
      frame.src = "about:blank";
      frame.remove();
    };
  }, [renderConfig, width, attempt, onReady, onError]);
  return <div className="preview-frame" ref={host} inert={loading} />;
}
