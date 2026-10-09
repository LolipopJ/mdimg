/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const fs = require("fs");
const { dirname, resolve } = require("path");
const { mdimg } = require("../lib/mdimg.js");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const options = (outputFilename, data = "new output") => ({
  inputText: "# Safe output",
  extensions: false,
  cssText: "",
  outputFilename,
  outputProcessor: {
    format: "txt",
    requiresPage: false,
    async process() {
      return { data };
    },
  },
});

afterEach(() => jest.restoreAllMocks());

test.each(["text", "binary"])(
  "SAVE: replaces an existing target with complete %s data",
  async (format) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    const data =
      format === "text" ? "new output" : Uint8Array.from([0, 127, 128, 255]);
    fs.writeFileSync(outputFilename, "original output");
    const rename = fs.renameSync;
    jest.spyOn(fs, "renameSync").mockImplementation((temporary, target) => {
      expect(dirname(temporary)).toBe(workspace.dir);
      expect(fs.readFileSync(target, "utf8")).toBe("original output");
      expect(fs.readFileSync(temporary)).toEqual(Buffer.from(data));
      rename(temporary, target);
    });

    const result = await mdimg(options(outputFilename, data));

    expect(result.path).toBe(outputFilename);
    expect(fs.readFileSync(outputFilename)).toEqual(Buffer.from(data));
    expect(fs.readdirSync(workspace.dir).sort()).toEqual([
      "input.md",
      "result.txt",
    ]);
  },
);

test.each([false, true])(
  "SAVE: partial write failure cleans temporary data (existing target=%s)",
  async (existing) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    if (existing) fs.writeFileSync(outputFilename, "original output");
    const write = fs.writeFileSync;
    jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation((file, data, options) => {
        if (data === "new output") {
          write(file, "partial output", options);
          throw new Error("simulated disk full");
        }
        return write(file, data, options);
      });

    await expect(mdimg(options(outputFilename))).rejects.toThrow(/disk full/);

    if (existing) {
      expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    } else expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(workspace.dir).sort()).toEqual(
      existing ? ["input.md", "result.txt"] : ["input.md"],
    );
  },
);

test.each([false, true])(
  "SAVE: failed replacement cleans temporary data (existing target=%s)",
  async (existing) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    if (existing) fs.writeFileSync(outputFilename, "original output");
    jest.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("simulated replacement denied");
    });

    await expect(mdimg(options(outputFilename))).rejects.toThrow(
      /replacement denied/,
    );

    if (existing) {
      expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    } else expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(workspace.dir).sort()).toEqual(
      existing ? ["input.md", "result.txt"] : ["input.md"],
    );
  },
);

test("SAVE: exclusive temporary creation preserves a colliding file", async () => {
  const outputFilename = resolve(workspace.dir, "result.txt");
  fs.writeFileSync(outputFilename, "original output");
  const open = fs.openSync;
  let collidingFilename;
  jest.spyOn(fs, "openSync").mockImplementation((filename, flags, mode) => {
    if (flags === "wx") {
      collidingFilename = filename;
      fs.writeFileSync(filename, "another writer's file");
    }
    return open(filename, flags, mode);
  });

  await expect(mdimg(options(outputFilename))).rejects.toThrow(/EEXIST/);

  expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
  expect(fs.readFileSync(collidingFilename, "utf8")).toBe(
    "another writer's file",
  );
});

test("SAVE: invalid output data leaves an existing target intact", async () => {
  const outputFilename = resolve(workspace.dir, "result.txt");
  fs.writeFileSync(outputFilename, "original output");

  await expect(mdimg(options(outputFilename, null))).rejects.toThrow();

  expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
  expect(fs.readdirSync(workspace.dir).sort()).toEqual([
    "input.md",
    "result.txt",
  ]);
});

test("SAVE: uses the final path and data returned by afterRender", async () => {
  const outputFilename = resolve(workspace.dir, "result.txt");
  const finalFilename = resolve(workspace.dir, "nested", "final.txt");
  const result = await mdimg({
    ...options(outputFilename),
    plugins: [
      {
        name: "final-output",
        hooks: {
          afterRender: (result) => ({
            ...result,
            path: finalFilename,
            data: "transformed output",
          }),
        },
      },
    ],
  });

  expect(result.path).toBe(finalFilename);
  expect(fs.readFileSync(finalFilename, "utf8")).toBe("transformed output");
  expect(fs.existsSync(outputFilename)).toBe(false);
  expect(fs.readdirSync(dirname(finalFilename))).toEqual(["final.txt"]);
});
