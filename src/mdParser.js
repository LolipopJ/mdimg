import { marked } from 'marked'

export function parseMarkdown(mdText) {
  return marked.parse(mdText)
}
