import type { IConvertOptions } from "../interfaces";

const isObject = (value: unknown): boolean =>
  value !== null &&
  typeof value === "object" &&
  Object.prototype.toString.call(value) === "[object Object]";

const isName = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validateInteger = (
  name: string,
  value: number,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(
      `${name} must be a finite integer between ${min} and ${max}.`,
    );
  }
};

/** Shared validation for library calls and CLI conversions, before any I/O. */
export const normalizeOptions = (options: IConvertOptions) => {
  if (!isObject(options)) {
    throw new Error("options must be an object.");
  }

  const {
    type = "png",
    width = 800,
    height = 100,
    encoding = "binary",
    quality = 100,
    htmlText,
    cssText,
    htmlTemplate = "default",
    cssTemplate = "default",
    theme = "light",
    extensions = true,
    plugins = [],
    log = false,
    debug = false,
    puppeteerProps = {},
    outputFilename,
    outputProcessor,
  } = options;

  for (const name of ["inputText", "mdText", "cssText"] as const) {
    if (options[name] !== undefined && typeof options[name] !== "string") {
      throw new Error(`${name} must be a string.`);
    }
  }
  for (const name of [
    "inputFilename",
    "mdFile",
    "outputFilename",
    "htmlText",
    "htmlTemplate",
    "cssTemplate",
  ] as const) {
    if (options[name] !== undefined && !isName(options[name])) {
      throw new Error(`${name} must be a non-empty string.`);
    }
  }

  // New fields override their deprecated aliases, even when explicitly empty.
  // A file always takes priority; whitespace text and empty files are allowed.
  const inputFilename =
    options.inputFilename !== undefined
      ? options.inputFilename
      : options.mdFile;
  const inputText =
    options.inputText !== undefined ? options.inputText : options.mdText;
  if (
    inputFilename === undefined &&
    (inputText === undefined || inputText === "")
  ) {
    throw new Error("text or file is required to be converted.");
  }

  validateInteger("width", width, 1);
  validateInteger("height", height, 100);
  validateInteger("quality", quality, 0, 100);
  if (!["jpeg", "png", "webp"].includes(type)) {
    throw new Error(
      `output file type ${type} is not supported. Valid types: jpeg, png, webp.`,
    );
  }
  if (!["base64", "binary", "blob"].includes(encoding)) {
    throw new Error(
      `encoding type ${encoding} is not supported. Valid types: base64, binary, blob.`,
    );
  }
  if (theme !== "light" && theme !== "dark") {
    throw new Error("theme must be 'light' or 'dark'.");
  }
  for (const [name, value] of Object.entries({ log, debug })) {
    if (typeof value !== "boolean") {
      throw new Error(`${name} must be a boolean.`);
    }
  }

  if (typeof extensions !== "boolean") {
    if (!isObject(extensions)) {
      throw new Error("extensions must be a boolean or an object.");
    }
    for (const [name, config] of Object.entries(extensions)) {
      if (
        config !== undefined &&
        typeof config !== "boolean" &&
        !isObject(config)
      ) {
        throw new Error(`extensions.${name} must be a boolean or an object.`);
      }
    }
  }

  if (!Array.isArray(plugins)) {
    throw new Error("plugins must be an array.");
  }
  for (const [index, plugin] of plugins.entries()) {
    const name = `plugins[${index}]`;
    if (!isObject(plugin) || !isName(plugin.name)) {
      throw new Error(`${name} must be an object with a non-empty name.`);
    }
    if (plugin.hooks !== undefined) {
      if (!isObject(plugin.hooks)) {
        throw new Error(`${name}.hooks must be an object.`);
      }
      for (const [hook, handler] of Object.entries(plugin.hooks)) {
        if (
          !["beforeParse", "afterParse", "afterSplice", "afterRender"].includes(
            hook,
          ) ||
          (handler !== undefined && typeof handler !== "function")
        ) {
          throw new Error(
            `${name}.hooks.${hook} must be a supported hook function.`,
          );
        }
      }
    }
    if (plugin.extensions !== undefined) {
      if (!Array.isArray(plugin.extensions)) {
        throw new Error(`${name}.extensions must be an array.`);
      }
      for (const [extensionIndex, extension] of plugin.extensions.entries()) {
        if (
          !isObject(extension) ||
          !isName(extension.name) ||
          typeof extension.inject !== "function"
        ) {
          throw new Error(
            `${name}.extensions[${extensionIndex}] must have a non-empty name and an inject function.`,
          );
        }
      }
    }
    if (plugin.markedExtensions !== undefined) {
      if (
        !Array.isArray(plugin.markedExtensions) ||
        ![...plugin.markedExtensions].every(isObject)
      ) {
        throw new Error(
          `${name}.markedExtensions must be an array of objects.`,
        );
      }
    }
  }

  if (
    outputProcessor !== undefined &&
    (!isObject(outputProcessor) ||
      !isName(outputProcessor.format) ||
      typeof outputProcessor.process !== "function" ||
      (outputProcessor.requiresPage !== undefined &&
        typeof outputProcessor.requiresPage !== "boolean"))
  ) {
    throw new Error(
      "outputProcessor must have a non-empty format, a process function, and an optional boolean requiresPage.",
    );
  }
  if (!isObject(puppeteerProps)) {
    throw new Error("puppeteerProps must be an object.");
  }
  if (
    puppeteerProps.args !== undefined &&
    (!Array.isArray(puppeteerProps.args) ||
      ![...puppeteerProps.args].every((arg) => typeof arg === "string"))
  ) {
    throw new Error("puppeteerProps.args must be an array of strings.");
  }

  return {
    inputText,
    inputFilename,
    outputFilename,
    type,
    width,
    height,
    encoding,
    quality,
    htmlText,
    cssText,
    htmlTemplate,
    cssTemplate,
    theme,
    extensions,
    plugins,
    log,
    debug,
    puppeteerProps,
    outputProcessor,
  };
};
