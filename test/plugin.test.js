/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg } = require("../lib/mdimg.js");
const { resolve } = require("path");
const { readFileSync, existsSync } = require("fs");

const inputText =
  "# Hello\n\nThis is a **test** document.\n\n```js\nconsole.log('hi');\n```\n";
const outputDir = resolve(__dirname, "../mdimg_output");

// ── Hook ordering ─────────────────────────────────────────────────────────────

test("PLUGIN: beforeParse hook is called with raw input and can transform it", async () => {
  let hookInput = null;

  const result = await mdimg({
    inputText,
    encoding: "base64",
    extensions: false,
    plugins: [
      {
        name: "transformPlugin",
        hooks: {
          beforeParse: (text) => {
            hookInput = text;
            return text.replace("Hello", "World");
          },
        },
      },
    ],
  });

  expect(hookInput).toBe(inputText);
  expect(result.html).toContain("World");
  expect(result.html).not.toMatch(/<h1[^>]*>Hello/);
});

test("PLUGIN: hooks run in registration order across multiple plugins", async () => {
  const order = [];

  await mdimg({
    inputText,
    encoding: "base64",
    extensions: false,
    plugins: [
      {
        name: "pluginA",
        hooks: {
          beforeParse: (text) => {
            order.push("A:beforeParse");
            return text;
          },
          afterParse: (html) => {
            order.push("A:afterParse");
            return html;
          },
          afterSplice: (html) => {
            order.push("A:afterSplice");
            return html;
          },
        },
      },
      {
        name: "pluginB",
        hooks: {
          beforeParse: (text) => {
            order.push("B:beforeParse");
            return text;
          },
          afterParse: (html) => {
            order.push("B:afterParse");
            return html;
          },
          afterSplice: (html) => {
            order.push("B:afterSplice");
            return html;
          },
        },
      },
    ],
  });

  expect(order).toEqual([
    "A:beforeParse",
    "B:beforeParse",
    "A:afterParse",
    "B:afterParse",
    "A:afterSplice",
    "B:afterSplice",
  ]);
});

// ── Extension name-based registry (dedup / override) ─────────────────────────

test("PLUGIN: plugin extension with same name replaces built-in (no duplicate)", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    encoding: "base64",
    extensions: { highlightJs: true, mathJax: false, mermaid: false },
    plugins: [
      {
        name: "overridePlugin",
        extensions: [
          {
            name: "highlightJs", // same name as built-in
            inject() {
              injected.push("custom-highlightJs");
              return { head: "<!-- custom-highlightJs-override -->" };
            },
          },
        ],
      },
    ],
  });

  // Custom ran exactly once (no duplicate injection)
  expect(injected).toHaveLength(1);
  // Custom output is present
  expect(result.html).toContain("<!-- custom-highlightJs-override -->");
  // Built-in highlight.js must NOT be present
  expect(result.html).not.toContain("hljs.highlightAll()");
});

test("PLUGIN: plugin extension with unique name is added alongside built-ins", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    encoding: "base64",
    extensions: { highlightJs: false, mathJax: false, mermaid: false },
    plugins: [
      {
        name: "addPlugin",
        extensions: [
          {
            name: "customExt",
            inject() {
              injected.push("customExt");
              return { head: "<!-- custom-ext -->" };
            },
          },
        ],
      },
    ],
  });

  expect(injected).toHaveLength(1);
  expect(result.html).toContain("<!-- custom-ext -->");
});

// ── afterRender binary semantics ─────────────────────────────────────────────

test("PLUGIN: afterRender receives Uint8Array data before disk write (binary)", async () => {
  const outputFilename = resolve(outputDir, "test-plugin-afterrender.png");
  let hookData = null;

  const result = await mdimg({
    inputText,
    outputFilename,
    extensions: false,
    plugins: [
      {
        name: "capturePlugin",
        hooks: {
          afterRender: (res) => {
            hookData = res.data;
            return res;
          },
        },
      },
    ],
  });

  // Hook received a Uint8Array (screenshot was taken to memory, not via Puppeteer path option)
  expect(hookData).toBeInstanceOf(Uint8Array);
  expect(result.path).toBe(outputFilename);
  expect(existsSync(outputFilename)).toBe(true);

  // File on disk must match what the hook saw / returned
  const onDisk = readFileSync(outputFilename);
  expect(Buffer.from(hookData).equals(onDisk)).toBe(true);
});

test("PLUGIN: afterRender data transform propagates to the output file on disk", async () => {
  const outputFilename = resolve(
    outputDir,
    "test-plugin-afterrender-transform.png",
  );
  let originalByteLength = 0;

  await mdimg({
    inputText,
    outputFilename,
    extensions: false,
    plugins: [
      {
        name: "transformPlugin",
        hooks: {
          afterRender: (res) => {
            originalByteLength = res.data.length;
            // Keep only the first 4 bytes (PNG magic) to make the result trivially verifiable
            return { ...res, data: res.data.slice(0, 4) };
          },
        },
      },
    ],
  });

  const onDisk = readFileSync(outputFilename);
  expect(originalByteLength).toBeGreaterThan(4);
  // Disk file reflects the hook's transformation, not the original screenshot
  expect(onDisk.length).toBe(4);
});

// ── extensions config suppression gate ───────────────────────────────────────

test("PLUGIN: extensions[name]=false suppresses a plugin-contributed extension", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    encoding: "base64",
    // Suppress the plugin extension by its name via the extensions config
    extensions: {
      highlightJs: false,
      mathJax: false,
      mermaid: false,
      customExt: false,
    },
    plugins: [
      {
        name: "suppressedPlugin",
        extensions: [
          {
            name: "customExt",
            inject() {
              injected.push("customExt");
              return { head: "<!-- should-not-appear -->" };
            },
          },
        ],
      },
    ],
  });

  // Extension must NOT have been injected
  expect(injected).toHaveLength(0);
  expect(result.html).not.toContain("<!-- should-not-appear -->");
});

test("PLUGIN: extensions[name]=true does NOT suppress a plugin-contributed extension", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    encoding: "base64",
    extensions: {
      highlightJs: false,
      mathJax: false,
      mermaid: false,
      customExt: true,
    },
    plugins: [
      {
        name: "activePlugin",
        extensions: [
          {
            name: "customExt",
            inject() {
              injected.push("customExt");
              return { head: "<!-- should-appear -->" };
            },
          },
        ],
      },
    ],
  });

  expect(injected).toHaveLength(1);
  expect(result.html).toContain("<!-- should-appear -->");
});

// ── markedExtensions: tokenizer, renderer priority, suppression ───────────────

/**
 * Reusable MarkedExtension that recognises ::text:: as an underline token.
 * Used across all three markedExtensions tests to keep fixtures consistent.
 */
const underlineMarkedExt = {
  extensions: [
    {
      name: "underline",
      level: "inline",
      start(src) {
        return src.indexOf("::");
      },
      tokenizer(src) {
        const match = src.match(/^::([^:]+)::/);
        if (match) {
          return { type: "underline", raw: match[0], text: match[1] };
        }
      },
      renderer(token) {
        return `<u>${token.text}</u>`;
      },
    },
  ],
};

test("PLUGIN: markedExtensions tokenizer produces custom HTML from custom syntax", async () => {
  const result = await mdimg({
    inputText: "Hello ::world::",
    encoding: "base64",
    extensions: false,
    plugins: [
      {
        name: "underlinePlugin",
        markedExtensions: [underlineMarkedExt],
      },
    ],
  });

  // Custom tokenizer ran: ::world:: → <u>world</u>
  expect(result.html).toContain("<u>world</u>");
});

test("PLUGIN: markedExtensions renderer override takes priority over built-in code renderer", async () => {
  const result = await mdimg({
    inputText: "```js\nconsole.log('hi');\n```",
    encoding: "base64",
    extensions: false,
    plugins: [
      {
        name: "codePlugin",
        markedExtensions: [
          {
            renderer: {
              code({ text }) {
                return `<div class="custom-code">${text}</div>`;
              },
            },
          },
        ],
      },
    ],
  });

  // Plugin renderer took priority — custom wrapper present
  expect(result.html).toContain('<div class="custom-code">');
  // Built-in renderer markup must NOT appear
  expect(result.html).not.toContain('<pre><code class="language-');
});

test("PLUGIN: extensions[pluginName]=false also suppresses markedExtensions from that plugin", async () => {
  const result = await mdimg({
    inputText: "Hello ::world::",
    encoding: "base64",
    // Suppress the whole plugin by its name
    extensions: { underlinePlugin: false },
    plugins: [
      {
        name: "underlinePlugin",
        markedExtensions: [underlineMarkedExt],
      },
    ],
  });

  // Plugin was suppressed — custom tokenizer must NOT have run
  expect(result.html).not.toContain("<u>world</u>");
  // "::world::" falls through as plain text
  expect(result.html).toContain("::world::");
});

test("PLUGIN: extensions[extensionName]=false suppresses markedExtensions of the owning plugin even when extensionName !== pluginName", async () => {
  // This covers the semantic gap: a plugin whose name differs from the
  // IExtension it registers. Suppressing by extension name must also stop
  // the plugin's markedExtensions so no half-enabled state is possible.
  const result = await mdimg({
    inputText: "Hello ::world::",
    encoding: "base64",
    // Suppress by EXTENSION name ("underlineExt"), NOT by plugin name ("mixedPlugin")
    extensions: { underlineExt: false },
    plugins: [
      {
        name: "mixedPlugin", // ← deliberately different from extension name
        extensions: [
          {
            name: "underlineExt", // ← the IExtension has a different name
            inject() {
              return { head: "<!-- underline-css -->" };
            },
          },
        ],
        markedExtensions: [underlineMarkedExt],
      },
    ],
  });

  // IExtension injection was suppressed
  expect(result.html).not.toContain("<!-- underline-css -->");
  // markedExtensions must also be suppressed — tokenizer must NOT have run
  expect(result.html).not.toContain("<u>world</u>");
  expect(result.html).toContain("::world::");
});
