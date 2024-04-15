import { marked } from "marked";

const parseMarkdown = async (mdText: string) => {
  return marked.parse(mdText);
};

export { parseMarkdown };
