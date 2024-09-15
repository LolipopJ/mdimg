import { marked } from "marked";

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  if (lang == "mermaid") return `<pre class="mermaid">${text}</pre>`;
  return `<pre><code class="language-${lang}">${text}</code></pre>`;
};

const parseMarkdown = async (mdText: string) => {
  return marked.parse(mdText, {
    renderer,
  });
};

export { parseMarkdown };
