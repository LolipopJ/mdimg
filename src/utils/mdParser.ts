import { marked } from "marked";

const parseMarkdown = async (mdText: string) => {
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }) => {
    const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (lang == "mermaid") return `<pre class="mermaid">${escapedText}</pre>`;
    return `<pre><code class="language-${lang}">${escapedText}</code></pre>`;
  };

  const parsedResult = marked.parse(mdText, {
    renderer,
  });

  return parsedResult;
};

export { parseMarkdown };
