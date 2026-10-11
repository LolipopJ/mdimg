const { spawnSync } = require("node:child_process");
const { readFileSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { createHtmlOutputProcessor } =
  requirePackage(__filename)("../lib/mdimg.js");
const { useImageAssertions } = require("./helpers/assertions");
const { useWorkspace } = require("./helpers/workspace");

const scriptFilename = resolve(__dirname, "../script/generate-previews.mjs");
const workspace = useWorkspace();
const expectImage = useImageAssertions();

function runPreview(args) {
  return spawnSync(process.execPath, [scriptFilename, ...args], {
    cwd: workspace.dir,
    encoding: "utf8",
    timeout: 60000,
  });
}

async function loadGenerator() {
  return (await importPackage(scriptFilename)).generatePreviews;
}

test("PREVIEWS: omitted styles render every CSS file with caller options", async () => {
  const generatePreviews = await loadGenerator();
  await generatePreviews({
    outputDir: workspace.dir,
    options: {
      inputText: "# Preview-override-marker",
      extensions: false,
      outputProcessor: createHtmlOutputProcessor(),
    },
  });
  const cssDir = resolve(__dirname, "../template/css");
  const styles = readdirSync(cssDir).filter((name) => name.endsWith(".css"));
  expect(
    readdirSync(workspace.dir)
      .filter((name) => name.endsWith(".png"))
      .sort(),
  ).toEqual(styles.map((name) => `${name.slice(0, -4)}.png`).sort());
  for (const file of styles) {
    const html = readFileSync(
      resolve(workspace.dir, `${file.slice(0, -4)}.png`),
      "utf8",
    );
    expect(html).toContain("<h1>Preview-override-marker</h1>");
    expect(html).toContain(readFileSync(resolve(cssDir, file), "utf8"));
  }
  const words = readFileSync(resolve(workspace.dir, "words.png"), "utf8");
  expect(words).toContain('<div class="top">');
});

test("PREVIEWS: a failed conversion waits for other active conversions", async () => {
  const generatePreviews = await loadGenerator();
  let completed = false;
  await expect(
    generatePreviews({
      styles: ["airbnb", "blueprint"],
      outputDir: workspace.dir,
      options: {
        inputFilename: workspace.inputFilename,
        extensions: false,
        outputProcessor: {
          format: "html",
          requiresPage: false,
          async process({ html, outputPath }) {
            if (outputPath.endsWith("blueprint.png"))
              throw new Error("preview failure");
            await delay(50);
            completed = true;
            return { data: html };
          },
        },
      },
    }),
  ).rejects.toThrow("preview failure");
  expect(completed).toBe(true);
  expect(readFileSync(resolve(workspace.dir, "airbnb.png"), "utf8")).toContain(
    "<h1>Hello</h1>",
  );
});

test.each([
  [["airbnb", "missing-style"], /Unknown style: missing-style/],
  [["--concurrency", "0"], /concurrency.*positive.*integer/i],
  [["--concurrency", "1.5"], /concurrency.*positive.*integer/i],
  [["--options", "{"], /JSON object/],
  [["--options", "null"], /JSON object/],
  [["--options", "[]"], /JSON object/],
  [["--options", '{"width":0}'], /width/],
])("PREVIEWS: invalid CLI arguments %j fail without outputs", (args, error) => {
  const result = runPreview([...args, "--output", workspace.dir]);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(error);
  expect(result.stdout).toBe("");
  expect(readdirSync(workspace.dir)).toEqual(["input.md"]);
});

test.each([0, -1, 1.5, Infinity])(
  "PREVIEWS: rejects concurrency %s before rendering",
  async (concurrency) => {
    const generatePreviews = await loadGenerator();
    await expect(
      generatePreviews({ outputDir: workspace.dir, concurrency }),
    ).rejects.toThrow(/concurrency.*positive.*integer/i);
    expect(
      readdirSync(workspace.dir).filter((name) => name.endsWith(".png")),
    ).toEqual([]);
  },
);

test.each([
  [undefined, 3],
  [1, 1],
  [2, 2],
  [20, 5],
])(
  "PREVIEWS: concurrency %s runs at most %s conversions",
  async (concurrency, expected) => {
    const generatePreviews = await loadGenerator();
    let active = 0;
    let peak = 0;
    await generatePreviews({
      styles: ["airbnb", "blueprint", "botanical", "paper", "swiss"],
      outputDir: workspace.dir,
      concurrency,
      options: {
        inputFilename: workspace.inputFilename,
        extensions: false,
        outputProcessor: {
          format: "html",
          requiresPage: false,
          async process({ html }) {
            active++;
            peak = Math.max(peak, active);
            await delay(50);
            active--;
            return { data: html };
          },
        },
      },
    });
    expect(peak).toBe(expected);
    expect(active).toBe(0);
    expect(
      readdirSync(workspace.dir)
        .filter((name) => name.endsWith(".png"))
        .sort(),
    ).toEqual([
      "airbnb.png",
      "blueprint.png",
      "botanical.png",
      "paper.png",
      "swiss.png",
    ]);
  },
);

test("PREVIEWS: CLI renders only selected styles with overridden width", async () => {
  const result = runPreview([
    "airbnb",
    "blueprint",
    "--concurrency",
    "2",
    "--output",
    workspace.dir,
    "--options",
    JSON.stringify({
      inputFilename: workspace.inputFilename,
      width: 360,
      extensions: false,
    }),
  ]);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
  expect(readdirSync(workspace.dir).sort()).toEqual([
    "airbnb.png",
    "blueprint.png",
    "input.md",
  ]);
  for (const name of ["airbnb", "blueprint"]) {
    const filename = resolve(workspace.dir, `${name}.png`);
    expect(result.stdout).toContain(`Generated ${filename}`);
    await expectImage(readFileSync(filename), "png", { width: 360 });
  }
});
