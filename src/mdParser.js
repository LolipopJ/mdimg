const { marked } = require("marked");

function parseMarkdown(mdText) {
  return marked.parse(mdText);
}

module.exports = { parseMarkdown };
