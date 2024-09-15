import { marked } from "marked";

const parseMarkdown = async (mdText: string) => {
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }) => {
    if (lang == "mermaid") return `<pre class="mermaid">${text}</pre>`;
    return `<pre><code class="language-${lang}">${text}</code></pre>`;
  };

  return marked.parse(mdText, {
    renderer,
  });
};

export { parseMarkdown };
