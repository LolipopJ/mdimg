import type { MarkedExtension } from "marked";
import { Marked } from "marked";

const parseMarkdown = async (
  mdText: string,
  markedExtensions: MarkedExtension[] = [],
) => {
  const instance = new Marked();

  // Apply built-in code renderer first (lowest priority).
  // Handles mermaid blocks and provides default code highlighting markup.
  instance.use({
    renderer: {
      code({ text, lang }) {
        const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (lang === "mermaid")
          return `<pre class="mermaid">${escapedText}</pre>`;
        return `<pre><code class="language-${lang}">${escapedText}</code></pre>`;
      },
    },
  });

  // Apply plugin-provided marked extensions (higher priority, can override
  // the built-in renderer above).
  for (const ext of markedExtensions) {
    instance.use(ext);
  }

  return instance.parse(mdText);
};

export { parseMarkdown };
