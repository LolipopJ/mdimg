/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { mdimg, createHtmlOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const { resolve } = require("path");
const { readFileSync, existsSync } = require("fs");
const { useWorkspace } = require("./helpers/workspace");
const { useImageAssertions } = require("./helpers/assertions");
const workspace = useWorkspace();
const expectImage = useImageAssertions();

const inputText =
  "# Hello\n\nThis is a **test** document.\n\n```js\nconsole.log('hi');\n```\n";
const builtinsDisabled = { highlightJs: false, mathJax: false, mermaid: false };

// ── Hook ordering ─────────────────────────────────────────────────────────────

test("PLUGIN: beforeParse hook is called with raw input and can transform it", async () => {
  let hookInput = null;

  const result = await mdimg({
    inputText,
    outputProcessor: createHtmlOutputProcessor(),
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

test("PLUGIN: async hooks pass transformed values in registration order across all four stages", async () => {
  const order = [];
  const outputFilename = resolve(workspace.dir, "async-hooks.html");

  const result = await mdimg({
    inputText: "# original",
    outputFilename,
    outputProcessor: createHtmlOutputProcessor(),
    extensions: builtinsDisabled,
    plugins: [
      {
        name: "pluginA",
        hooks: {
          beforeParse: async (text) => {
            order.push("A:beforeParse");
            expect(text).toBe("# original");
            return text.replace("original", "parsed-A");
          },
          afterParse: async (html) => {
            order.push("A:afterParse");
            expect(html).toContain("<h1>parsed-A-B</h1>");
            return html.replace("parsed-A-B", "html-A");
          },
          afterSplice: async (html) => {
            order.push("A:afterSplice");
            expect(html).toContain("<h1>html-A-B</h1>");
            return html.replace("html-A-B", "spliced-A");
          },
          afterRender: async (result) => {
            order.push("A:afterRender");
            expect(existsSync(outputFilename)).toBe(false);
            expect(result.data).toContain("<h1>spliced-A-B</h1>");
            return { ...result, data: "rendered-A" };
          },
        },
      },
      {
        name: "pluginB",
        hooks: {
          beforeParse: async (text) => {
            order.push("B:beforeParse");
            expect(text).toBe("# parsed-A");
            return `${text}-B`;
          },
          afterParse: async (html) => {
            order.push("B:afterParse");
            expect(html).toContain("<h1>html-A</h1>");
            return html.replace("html-A", "html-A-B");
          },
          afterSplice: async (html) => {
            order.push("B:afterSplice");
            expect(html).toContain("<h1>spliced-A</h1>");
            return html.replace("spliced-A", "spliced-A-B");
          },
          afterRender: async (result) => {
            order.push("B:afterRender");
            expect(existsSync(outputFilename)).toBe(false);
            expect(result.data).toBe("rendered-A");
            return { ...result, data: `${result.data}-B` };
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
    "A:afterRender",
    "B:afterRender",
  ]);
  expect(result.html).toContain("<h1>spliced-A-B</h1>");
  expect(result.data).toBe("rendered-A-B");
  expect(result.path).toBe(outputFilename);
  expect(readFileSync(outputFilename, "utf8")).toBe("rendered-A-B");
});

test.each([
  ["beforeParse", ["A:beforeParse"]],
  ["afterParse", ["A:beforeParse", "B:beforeParse", "A:afterParse"]],
  [
    "afterSplice",
    [
      "A:beforeParse",
      "B:beforeParse",
      "A:afterParse",
      "B:afterParse",
      "A:afterSplice",
    ],
  ],
  [
    "afterRender",
    [
      "A:beforeParse",
      "B:beforeParse",
      "A:afterParse",
      "B:afterParse",
      "A:afterSplice",
      "B:afterSplice",
      "process",
      "A:afterRender",
    ],
  ],
])(
  "PLUGIN: async %s rejection stops subsequent hooks and disk write",
  async (stage, expectedOrder) => {
    const order = [];
    const failure = new Error(`hook-failure:${stage}`);
    const outputFilename = resolve(workspace.dir, "rejected.html");
    const plugins = ["A", "B"].map((name) => ({
      name,
      hooks: Object.fromEntries(
        ["beforeParse", "afterParse", "afterSplice", "afterRender"].map(
          (hook) => [
            hook,
            async (value) => {
              order.push(`${name}:${hook}`);
              if (name === "A" && hook === stage) throw failure;
              return value;
            },
          ],
        ),
      ),
    }));

    await expect(
      mdimg({
        inputText,
        outputFilename,
        extensions: builtinsDisabled,
        plugins,
        outputProcessor: {
          format: "html",
          requiresPage: false,
          process: ({ html }) => {
            order.push("process");
            return { data: html };
          },
        },
      }),
    ).rejects.toBe(failure);
    expect(order).toEqual(expectedOrder);
    expect(existsSync(outputFilename)).toBe(false);
  },
);

// ── Extension name-based registry (dedup / override) ─────────────────────────

test("PLUGIN: plugin extension with same name replaces built-in (no duplicate)", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    outputProcessor: createHtmlOutputProcessor(),
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
  expect(result.html).not.toContain("<!-- highlight.js -->");
  expect(result.html).not.toMatch(/name:\s*["']highlightJs["']/);
});

test("PLUGIN: plugin extension with unique name is added alongside built-ins", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    outputProcessor: {
      format: "html",
      async process({ html, page }) {
        expect(
          await page.$eval("pre code", (code) =>
            code.classList.contains("hljs"),
          ),
        ).toBe(true);
        expect(
          await page.$eval("pre code .hljs-string", (node) => node.textContent),
        ).toBe("'hi'");
        expect(
          await page.$eval("#custom-extension", (node) => node.textContent),
        ).toBe("plugin active");
        return { data: html };
      },
    },
    extensions: { highlightJs: true, mathJax: false, mermaid: false },
    plugins: [
      {
        name: "addPlugin",
        extensions: [
          {
            name: "customExt",
            inject() {
              injected.push("customExt");
              return {
                head: "<!-- custom-ext -->",
                body: '<span id="custom-extension">plugin active</span>',
              };
            },
          },
        ],
      },
    ],
  });

  expect(injected).toHaveLength(1);
  expect(result.html).toContain("<!-- custom-ext -->");
  expect(result.html).toContain("<!-- highlight.js -->");
});

// ── afterRender binary semantics ─────────────────────────────────────────────

test("PLUGIN: afterRender receives Uint8Array data before disk write (binary)", async () => {
  const outputFilename = resolve(workspace.dir, "test-plugin-afterrender.png");
  let hookData = null;

  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    outputFilename,
    extensions: false,
    plugins: [
      {
        name: "capturePlugin",
        hooks: {
          afterRender: (res) => {
            expect(existsSync(outputFilename)).toBe(false);
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
  await expectImage(onDisk, "png");
});

test("PLUGIN: afterRender data transform propagates to the output file on disk", async () => {
  const outputFilename = resolve(
    workspace.dir,
    "test-plugin-afterrender-transform.png",
  );
  let originalByteLength = 0;

  const result = await mdimg({
    inputFilename: workspace.inputFilename,
    outputFilename,
    extensions: false,
    plugins: [
      {
        name: "transformPlugin",
        hooks: {
          afterRender: (res) => {
            expect(existsSync(outputFilename)).toBe(false);
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
  expect(onDisk).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  expect(onDisk).toEqual(Buffer.from(result.data));
});

// ── extensions config suppression gate ───────────────────────────────────────

test("PLUGIN: extensions[name]=false suppresses a plugin-contributed extension", async () => {
  const injected = [];

  const result = await mdimg({
    inputText,
    outputProcessor: createHtmlOutputProcessor(),
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
    outputProcessor: createHtmlOutputProcessor(),
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

function createMultiExtensionPlugin() {
  return {
    name: "multiExtensionPlugin",
    extensions: ["firstExt", "secondExt"].map((name) => ({
      name,
      inject: jest.fn(() => ({ head: `<!-- ${name} -->` })),
    })),
    markedExtensions: [underlineMarkedExt],
  };
}

test.each([
  ["global disable suppresses injection and marked extensions", false],
  [
    "plugin name disables all owned extensions",
    {
      highlightJs: false,
      mathJax: false,
      mermaid: false,
      multiExtensionPlugin: false,
    },
  ],
])("PLUGIN: %s", async (_name, extensions) => {
  const plugin = createMultiExtensionPlugin();
  const { html } = await mdimg({
    inputText: "Hello ::world::",
    outputProcessor: createHtmlOutputProcessor(),
    extensions,
    plugins: [plugin],
  });

  for (const extension of plugin.extensions) {
    expect(extension.inject).not.toHaveBeenCalled();
    expect(html).not.toContain(`<!-- ${extension.name} -->`);
  }
  expect(html).toContain("Hello ::world::");
  expect(html).not.toContain("<u>world</u>");
});

test("PLUGIN: active plugin injects all owned extensions and parses custom syntax", async () => {
  const plugin = createMultiExtensionPlugin();
  const { html } = await mdimg({
    inputText: "Hello ::world::",
    outputProcessor: createHtmlOutputProcessor(),
    extensions: builtinsDisabled,
    plugins: [plugin],
  });

  for (const extension of plugin.extensions) {
    expect(extension.inject).toHaveBeenCalledTimes(1);
    expect(html).toContain(`<!-- ${extension.name} -->`);
  }
  expect(html).toContain("Hello <u>world</u>");
});

test("PLUGIN: disabling an earlier plugin preserves an extension replaced by another plugin", async () => {
  const inactiveInject = jest.fn(() => ({ head: "<!-- inactive-owner -->" }));
  const activeInject = jest.fn(() => ({ head: "<!-- active-owner -->" }));
  const { html } = await mdimg({
    inputText: "Hello ::world::",
    outputProcessor: createHtmlOutputProcessor(),
    extensions: { ...builtinsDisabled, inactivePlugin: false },
    plugins: [
      {
        name: "inactivePlugin",
        extensions: [{ name: "sharedExt", inject: inactiveInject }],
      },
      {
        name: "activePlugin",
        extensions: [{ name: "sharedExt", inject: activeInject }],
        markedExtensions: [underlineMarkedExt],
      },
    ],
  });

  expect(inactiveInject).not.toHaveBeenCalled();
  expect(activeInject).toHaveBeenCalledTimes(1);
  expect(html).not.toContain("<!-- inactive-owner -->");
  expect(html).toContain("<!-- active-owner -->");
  expect(html).toContain("Hello <u>world</u>");
});

test.each(["sequential", "concurrent"])(
  "PLUGIN: marked extensions stay isolated between %s calls",
  async (mode) => {
    const options = {
      inputText: "Hello ::world::",
      outputProcessor: createHtmlOutputProcessor(),
      extensions: builtinsDisabled,
    };
    const pluginOptions = {
      ...options,
      plugins: [
        { name: "underlinePlugin", markedExtensions: [underlineMarkedExt] },
      ],
    };
    const results =
      mode === "concurrent"
        ? await Promise.all([mdimg(pluginOptions), mdimg(options)])
        : [await mdimg(pluginOptions), await mdimg(options)];

    expect(results[0].html).toContain("Hello <u>world</u>");
    expect(results[0].html).not.toContain("::world::");
    expect(results[1].html).toContain("Hello ::world::");
    expect(results[1].html).not.toContain("<u>world</u>");
  },
);

test("PLUGIN: markedExtensions tokenizer produces custom HTML from custom syntax", async () => {
  const result = await mdimg({
    inputText: "Hello ::world::",
    outputProcessor: createHtmlOutputProcessor(),
    extensions: builtinsDisabled,
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
    outputProcessor: createHtmlOutputProcessor(),
    extensions: builtinsDisabled,
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
    outputProcessor: createHtmlOutputProcessor(),
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
    outputProcessor: createHtmlOutputProcessor(),
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
