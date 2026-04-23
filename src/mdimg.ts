import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

import type {
  IConvertEncodingOption,
  IConvertOptions,
  IConvertResponse,
  IConvertTypeOption,
  IOutputProcessor,
} from "./interfaces";
import { createImageOutputProcessor } from "./output";
import { spliceHtml } from "./utils/htmlSplicer";
import { parseMarkdown } from "./utils/mdParser";
import { PluginManager } from "./utils/pluginManager";
import {
  createEmptyFile,
  generateImageDefaultFilename,
  padStartWithZero,
} from "./utils/utils";

const mdimg = async ({
  inputText,
  inputFilename,
  mdText,
  mdFile,
  outputFilename,
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
  outputProcessor,
}: IConvertOptions): Promise<IConvertResponse> => {
  const _outputFileTypes: IConvertTypeOption[] = ["jpeg", "png", "webp"];
  const _encodingTypes: IConvertEncodingOption[] = ["base64", "binary", "blob"];

  const _result: IConvertResponse = {
    html: "",
    data: encoding === "base64" ? "" : Uint8Array.from([]),
    path: undefined,
  };

  // Resolve input file or text
  let _input: string;
  const _inputFilename = inputFilename || mdFile;
  const _inputText = inputText || mdText;
  if (_inputFilename) {
    const _inputFilePath = path.resolve(_inputFilename);
    if (fs.existsSync(_inputFilePath)) {
      if (fs.statSync(_inputFilePath).isFile()) {
        _input = fs.readFileSync(_inputFilePath).toString();

        if (log) {
          process.stderr.write(
            `Info: start to convert file ${_inputFilePath} to an image...\n`,
          );
        }
      } else {
        throw new Error("input is not a file.\n");
      }
    } else {
      throw new Error(`input file ${_inputFilePath} is not exists.\n`);
    }
  } else if (_inputText) {
    _input = _inputText;

    if (log) {
      process.stderr.write(`Info: start to convert text to an image...\n`);
    }
  } else {
    throw new Error("text or file is required to be converted.\n");
  }

  // Resolve encoding
  const _encoding = encoding;
  // Custom processors: disk write happens only when outputFilename is explicitly
  // provided. Image processors: disk write only when encoding is "binary".
  const _saveToDisk = outputProcessor
    ? Boolean(outputFilename)
    : _encoding === "binary";
  if (!outputProcessor && !_encodingTypes.includes(_encoding)) {
    throw new Error(
      `encoding type ${_encoding} is not supported. Valid types: ${_encodingTypes.join(", ")}.\n`,
    );
  }

  // Resolve output file type
  let _type = type;
  if (!outputProcessor && !_outputFileTypes.includes(_type)) {
    throw new Error(
      `output file type ${_type} is not supported. Valid types: ${_outputFileTypes.join(", ")}.\n`,
    );
  }

  // Resolve output filename
  let _output: IConvertOptions["outputFilename"];
  if (_saveToDisk) {
    if (outputProcessor) {
      // Custom processor: outputFilename must be explicit (_saveToDisk already
      // ensured this). Resolve to an absolute path without extension validation.
      _output = path.resolve(
        outputFilename!,
      ) as IConvertOptions["outputFilename"];
    } else if (outputFilename) {
      // Image output: extension-aware resolution.
      const _outputFilename = path.basename(outputFilename);
      const _outputFilePath = path.dirname(outputFilename);

      const _outputFilenameArr = _outputFilename.split(".");
      const _outputFilenameArrLength = _outputFilenameArr.length;

      if (_outputFilenameArrLength <= 1) {
        // Output file type is not specified
        _output = path.resolve(
          _outputFilePath,
          `${_outputFilename}.${_type}`,
        ) as IConvertOptions["outputFilename"];
      } else {
        const _outputFileType = _outputFilenameArr[
          _outputFilenameArrLength - 1
        ] as IConvertTypeOption;

        if (_outputFileTypes.includes(_outputFileType)) {
          // Option type is overridden
          _type = _outputFileType;
          _output = path.resolve(
            outputFilename,
          ) as IConvertOptions["outputFilename"];
        } else {
          // Output file type is wrongly specified
          if (log) {
            process.stderr.write(
              `Warning: output file type must be one of 'jpeg', 'png' or 'webp'. Use '${_type}' type.\n`,
            );
          }
          _output = path.resolve(
            _outputFilePath,
            `${_outputFilename}.${_type}`,
          ) as IConvertOptions["outputFilename"];
        }
      }
    } else {
      _output = path.resolve(
        "mdimg_output",
        generateImageDefaultFilename(_type),
      ) as IConvertOptions["outputFilename"];
    }
  }

  // Resolve quality (used by the default image processor)
  let _quality;
  if (_type !== "png") {
    _quality = quality > 0 && quality <= 100 ? quality : 100;
  }

  // Select the output processor: custom or default image processor.
  const _processor: IOutputProcessor =
    outputProcessor ?? createImageOutputProcessor(_type, _quality, _encoding);
  const _requiresPage = _processor.requiresPage !== false;

  // Parse markdown text to HTML
  const _pluginManager = new PluginManager(extensions, plugins);

  const _preprocessed = await _pluginManager.beforeParse(_input);
  const _parsedHtml = await parseMarkdown(
    _preprocessed,
    _pluginManager.getMarkedExtensions(),
  );
  const _renderedHtml = await _pluginManager.afterParse(_parsedHtml);

  const _splicedHtml = await spliceHtml({
    renderedHtml: _renderedHtml,
    htmlText,
    cssText,
    htmlTemplate,
    cssTemplate,
    theme,
    resolvedExtensions: _pluginManager.getExtensions(),
    log,
  });

  const _html = await _pluginManager.afterSplice(_splicedHtml);
  _result.html = _html;

  if (_requiresPage) {
    // Launch headless browser to render HTML
    const _minHeight = Math.max(height, 100);
    const _browser = await puppeteer.launch({
      defaultViewport: {
        width,
        height: _minHeight,
      },
      args: [`--window-size=${width},${_minHeight}`],
      ...puppeteerProps,
    });

    const _baseDirname = _inputFilename
      ? path.dirname(path.resolve(_inputFilename))
      : process.cwd();
    const _tempLocalHtmlFile = path.resolve(
      _baseDirname,
      `.mdimg_temp_${new Date().getTime()}_${padStartWithZero(
        Math.floor(Math.random() * 10000),
        4,
      )}.html`,
    );
    try {
      fs.writeFileSync(_tempLocalHtmlFile, _html); // used to load local files
    } catch (error) {
      if (log) {
        process.stderr.write(
          `Warning: write temporary local HTML file failed, local files may not display correctly. ${error}\n`,
        );
      }
    }
    const _useLocalHtmlFileFlag = fs.existsSync(_tempLocalHtmlFile);

    const cleanup = async () => {
      if (_useLocalHtmlFileFlag && !debug) {
        fs.rmSync(_tempLocalHtmlFile);
      }
      await _browser.close();
    };

    try {
      const _page = await _browser.newPage();
      if (_useLocalHtmlFileFlag) {
        await _page.goto(`file://${_tempLocalHtmlFile}`, {
          waitUntil: "networkidle0",
        });
      } else {
        await _page.setContent(_html, {
          waitUntil: "networkidle0",
        });
      }

      const _body = await _page.$("#mdimg-body");
      if (!_body) {
        throw new Error(
          `missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.\n`,
        );
      }

      const _processResult = await _processor.process({
        html: _html,
        page: _page,
        body: _body,
        outputPath: _saveToDisk ? String(_output) : undefined,
      });
      _result.data = _processResult.data;
      _result.path = _saveToDisk ? _output : undefined;
    } catch (error: unknown) {
      throw new Error(String(error), {
        cause: error,
      });
    } finally {
      await cleanup();
    }
  } else {
    // No browser needed (e.g. HTML export with requiresPage: false)
    const _processResult = await _processor.process({
      html: _html,
      outputPath: _saveToDisk ? String(_output) : undefined,
    });
    _result.data = _processResult.data;
    _result.path = _saveToDisk ? _output : undefined;
  }

  // Run afterRender hook BEFORE disk write so the hook can affect the output file
  const _finalResult = await _pluginManager.afterRender(_result);

  if (_saveToDisk && _finalResult.path) {
    createEmptyFile(String(_finalResult.path));
    fs.writeFileSync(String(_finalResult.path), _finalResult.data);
    if (log) {
      process.stderr.write(
        `Success: convert to image and saved as ${_finalResult.path} successfully!\n`,
      );
    }
  } else if (log) {
    process.stderr.write(
      _encoding === "base64"
        ? `Success: convert to BASE64 encoded string successfully!\n`
        : `Success: convert to image successfully!\n`,
    );
  }

  return _finalResult;
};

export { mdimg as convert2img, mdimg };
export {
  createHtmlOutputProcessor,
  createImageOutputProcessor,
  createPdfOutputProcessor,
} from "./output";
