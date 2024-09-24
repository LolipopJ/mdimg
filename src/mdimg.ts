import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

import type {
  IConvertEncodingOption,
  IConvertOptions,
  IConvertResponse,
  IConvertTypeOption,
} from "./interfaces";
import { spliceHtml } from "./utils/htmlSplicer";
import { parseMarkdown } from "./utils/mdParser";
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
  log = false,
  debug = false,
  puppeteerProps = {},
}: IConvertOptions): Promise<IConvertResponse> => {
  const _outputFileTypes: IConvertTypeOption[] = ["jpeg", "png", "webp"];
  const _encodingTypes: IConvertEncodingOption[] = ["base64", "binary", "blob"];

  const _result: IConvertResponse = {
    html: "",
    data: encoding === "base64" ? "" : Uint8Array.from([]),
    path: undefined,
  };

  // Resolve input file or text
  let _input = "";
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
        throw new Error("Error: input is not a file.\n");
      }
    } else {
      throw new Error(`Error: input file ${_inputFilePath} is not exists.\n`);
    }
  } else if (_inputText) {
    _input = _inputText;

    if (log) {
      process.stderr.write(`Info: start to convert text to an image...\n`);
    }
  } else {
    throw new Error("Error: text or file is required to be converted.\n");
  }

  // Resolve encoding
  const _encoding = encoding;
  const _saveToDisk = _encoding === "binary";
  if (!_encodingTypes.includes(_encoding)) {
    // Params encoding is not valid
    throw new Error(
      `Error: encoding type ${_encoding} is not supported. Valid types: ${_encodingTypes.join(", ")}.\n`,
    );
  }

  // Resolve output file type
  let _type = type;
  if (!_outputFileTypes.includes(_type)) {
    // Params encoding is not valid
    throw new Error(
      `Error: output file type ${_type} is not supported. Valid types: ${_outputFileTypes.join(", ")}.\n`,
    );
  }

  // Resolve output filename
  let _output = "";
  if (_saveToDisk) {
    if (outputFilename) {
      // Check validation of output filename
      const _outputFilename = path.basename(outputFilename);
      const _outputFilePath = path.dirname(outputFilename);

      const _outputFilenameArr = _outputFilename.split(".");
      const _outputFilenameArrLength = _outputFilenameArr.length;

      if (_outputFilenameArrLength <= 1) {
        // Output file type is not specified
        _output = path.resolve(_outputFilePath, `${_outputFilename}.${_type}`);
      } else {
        const _outputFileType = _outputFilenameArr[
          _outputFilenameArrLength - 1
        ] as IConvertTypeOption;

        if (_outputFileTypes.includes(_outputFileType)) {
          // Option type is overridden
          _type = _outputFileType;
          _output = path.resolve(outputFilename);
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
          );
        }
      }
    } else {
      _output = path.resolve(
        "mdimg_output",
        generateImageDefaultFilename(_type),
      );
    }
  }

  // Resolve quality
  let _quality;
  if (_type !== "png") {
    _quality = quality > 0 && quality <= 100 ? quality : 100;
  }

  // Parse markdown text to HTML
  const _html = spliceHtml({
    renderedHtml: await parseMarkdown(_input),
    htmlText,
    cssText,
    htmlTemplate,
    cssTemplate,
    extensions,
    theme,
    log,
  });
  _result.html = _html;

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
        `Error: missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.\n`,
      );
    }

    if (_encoding === "binary" || _encoding === "blob") {
      if (_saveToDisk) {
        // Create empty output file
        createEmptyFile(_output);
      }

      // Generate output image
      const _outputBlob = await _body.screenshot({
        path: _saveToDisk ? _output : undefined,
        type: _type,
        quality: _quality,
        encoding: "binary",
      });
      if (log) {
        process.stderr.write(
          `Info: convert to image${_saveToDisk ? ` and saved as ${_output}` : ""} successfully!\n`,
        );
      }

      _result.data = _outputBlob;
      _result.path = _saveToDisk ? _output : undefined;
    } else if (_encoding === "base64") {
      // Generate base64 encoded image
      const _outputBase64String = await _body.screenshot({
        type: _type,
        quality: _quality,
        encoding: "base64",
      });
      if (log) {
        process.stderr.write(
          `Info: convert to BASE64 encoded string successfully!\n`,
        );
      }

      _result.data = _outputBase64String;
    }
  } catch (error: unknown) {
    throw new Error(String(error));
  } finally {
    await cleanup();
  }

  return _result;
};

export { mdimg as convert2img, mdimg };
