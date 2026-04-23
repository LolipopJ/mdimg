import type { MarkedExtension } from "marked";
declare const parseMarkdown: (mdText: string, markedExtensions?: MarkedExtension[]) => Promise<string>;
export { parseMarkdown };
