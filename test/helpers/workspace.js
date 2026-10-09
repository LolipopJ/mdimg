/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mkdtempSync, rmSync, writeFileSync } = require("fs");
const { tmpdir } = require("os");
const { dirname, join } = require("path");

const inputText =
  "# Hello\n\nThis is a **test** document.\n\n```js\nconsole.log('hi');\n```\n";

function useWorkspace() {
  const workspace = {};

  beforeEach(() => {
    workspace.dir = mkdtempSync(join(tmpdir(), "mdimg test & quotes-"));
    workspace.inputFilename = join(workspace.dir, "input.md");
    writeFileSync(workspace.inputFilename, inputText);
  });

  afterEach(() => {
    if (workspace.dir && dirname(workspace.dir) === tmpdir()) {
      rmSync(workspace.dir, { recursive: true, force: true });
    }
  });

  return workspace;
}

module.exports = { inputText, useWorkspace };
