const fs = require("fs");
const { dirname, resolve } = require("path");
const { mdimg } = requirePackage(__filename)("../lib/mdimg.js");
const { useWorkspace } = require("./helpers/workspace");

const workspace = useWorkspace();
const outputData = {
  text: "new output",
  binary: Uint8Array.from([0, 127, 128, 255]),
};
const failureCases = ["text", "binary"].flatMap((format) =>
  [false, true].map((existing) => [format, existing]),
);
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
    const data = outputData[format];
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

test.each(failureCases)(
  "SAVE: partial %s write failure cleans temporary data (existing target=%s)",
  async (format, existing) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    const data = outputData[format];
    if (existing) fs.writeFileSync(outputFilename, "original output");
    const write = fs.writeFileSync;
    jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation((file, content, options) => {
        if (content === data) {
          write(file, content.slice(0, 2), options);
          throw new Error("simulated disk full");
        }
        return write(file, content, options);
      });

    await expect(mdimg(options(outputFilename, data))).rejects.toThrow(
      /disk full/,
    );

    if (existing) {
      expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    } else expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(workspace.dir).sort()).toEqual(
      existing ? ["input.md", "result.txt"] : ["input.md"],
    );
  },
);

test.each(failureCases)(
  "SAVE: failed %s replacement cleans temporary data (existing target=%s)",
  async (format, existing) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    if (existing) fs.writeFileSync(outputFilename, "original output");
    jest.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("simulated replacement denied");
    });

    await expect(
      mdimg(options(outputFilename, outputData[format])),
    ).rejects.toThrow(/replacement denied/);

    if (existing) {
      expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    } else expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(workspace.dir).sort()).toEqual(
      existing ? ["input.md", "result.txt"] : ["input.md"],
    );
  },
);

test.each(failureCases)(
  "SAVE: failed %s close cleans temporary data (existing target=%s)",
  async (format, existing) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    if (existing) fs.writeFileSync(outputFilename, "original output");
    const close = fs.closeSync;
    jest.spyOn(fs, "closeSync").mockImplementation((fd) => {
      close(fd);
      throw new Error("simulated close failure");
    });

    await expect(
      mdimg(options(outputFilename, outputData[format])),
    ).rejects.toThrow(/close failure/);

    // Restore before reading files: the injected failure only concerns the writer.
    jest.restoreAllMocks();
    if (existing) {
      expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    } else expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(workspace.dir).sort()).toEqual(
      existing ? ["input.md", "result.txt"] : ["input.md"],
    );
  },
);

test.each(["text", "binary"])(
  "SAVE: exclusive temporary creation preserves a colliding file (%s)",
  async (format) => {
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

    await expect(
      mdimg(options(outputFilename, outputData[format])),
    ).rejects.toThrow(/EEXIST/);

    expect(fs.readFileSync(outputFilename, "utf8")).toBe("original output");
    expect(fs.readFileSync(collidingFilename, "utf8")).toBe(
      "another writer's file",
    );
  },
);

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

test.each(["text", "binary"])(
  "SAVE: uses the final path and %s data returned by afterRender",
  async (format) => {
    const outputFilename = resolve(workspace.dir, "result.txt");
    const finalFilename = resolve(workspace.dir, "nested", "final.txt");
    const initialData = outputData[format];
    const finalData =
      format === "text" ? "transformed output" : Uint8Array.from([255, 128, 0]);
    const result = await mdimg({
      ...options(outputFilename, initialData),
      plugins: [
        {
          name: "final-output",
          hooks: {
            afterRender: (result) => {
              expect(result.data).toBe(initialData);
              expect(result.path).toBe(outputFilename);
              expect(fs.existsSync(outputFilename)).toBe(false);
              expect(fs.existsSync(finalFilename)).toBe(false);
              return {
                ...result,
                path: finalFilename,
                data: finalData,
              };
            },
          },
        },
      ],
    });

    expect(result.path).toBe(finalFilename);
    expect(result.data).toBe(finalData);
    expect(fs.readFileSync(finalFilename)).toEqual(Buffer.from(finalData));
    expect(fs.existsSync(outputFilename)).toBe(false);
    expect(fs.readdirSync(dirname(finalFilename))).toEqual(["final.txt"]);
  },
);
