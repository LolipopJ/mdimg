import { resolve, dirname, basename } from "path";
import {
  existsSync,
  statSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import puppeteer from "puppeteer";
import { parseMarkdown } from "./utils/mdParser";
import { spliceHtml } from "./utils/htmlSplicer";
import type {
  IConvertOptions,
  IConvertTypeOption,
  IConvertEncodingOption,
  IConvertResponse,
} from "./interfaces";

const mdimg = async ({
  inputText,
  inputFilename,
  mdText,
  mdFile,
  outputFilename,
  type = "png",
  width = 800,
  height = 600,
  encoding = "binary",
  quality = 100,
  htmlText,
  cssText,
  htmlTemplate = "default",
  cssTemplate = "default",
  log = false,
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
    const _inputFilePath = resolve(_inputFilename);
    if (existsSync(_inputFilePath)) {
      if (statSync(_inputFilePath).isFile()) {
        _input = readFileSync(_inputFilePath).toString();

        if (log) {
          process.stderr.write(
            `Start to convert ${_inputFilePath} to an image.\n`,
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
      const _outputFilename = basename(outputFilename);
      const _outputFilePath = dirname(outputFilename);

      const _outputFilenameArr = _outputFilename.split(".");
      const _outputFilenameArrLength = _outputFilenameArr.length;

      if (_outputFilenameArrLength <= 1) {
        // Output file type is not specified
        _output = resolve(_outputFilePath, `${_outputFilename}.${_type}`);
      } else {
        const _outputFileType = _outputFilenameArr[
          _outputFilenameArrLength - 1
        ] as IConvertTypeOption;

        if (_outputFileTypes.includes(_outputFileType)) {
          // Option type is overridden
          _type = _outputFileType;
          _output = resolve(outputFilename);
        } else {
          // Output file type is wrongly specified
          if (log) {
            process.stderr.write(
              `Warning: output file type must be one of 'jpeg', 'png' or 'webp'. Use '${_type}' type.\n`,
            );
          }
          _output = resolve(_outputFilePath, `${_outputFilename}.${_type}`);
        }
      }
    } else {
      _output = resolve("mdimg_output", _generateImageFilename(_type));
    }
  }

  // Resolve quality
  let _quality;
  if (_type !== "png") {
    _quality = quality > 0 && quality <= 100 ? quality : 100;
  }

  // Parse markdown text to HTML
  const _html = spliceHtml({
    inputHtml: await parseMarkdown(_input),
    htmlText,
    cssText,
    htmlTemplate: _resolveTemplateName(htmlTemplate),
    cssTemplate: _resolveTemplateName(cssTemplate),
    log,
  });
  _result.html = _html;

  // Launch headless browser to render HTML
  const _browser = await puppeteer.launch({
    defaultViewport: {
      width,
      height,
    },
    args: [`--window-size=${width},${height}`],
    ...puppeteerProps,
  });
  const _page = await _browser.newPage();
  await _page.setContent(_html, {
    waitUntil: "networkidle0",
  });

  const _body = await _page.$("#mdimg-body");
  if (_body) {
    if (_encoding === "binary" || _encoding === "blob") {
      if (_saveToDisk) {
        // Create empty output file
        _createEmptyFile(_output);
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

    await _browser.close();

    return _result;
  } else {
    await _browser.close();

    throw new Error(
      `Error: missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.\n`,
    );
  }
};

function _resolveTemplateName(templateName: string) {
  const _templateName = templateName.split(".")[0];
  return _templateName as IConvertOptions["htmlTemplate"] &
    IConvertOptions["cssTemplate"];
}

function _createEmptyFile(filename: string) {
  const _filePath = dirname(filename);

  try {
    mkdirSync(_filePath, { recursive: true });
    writeFileSync(filename, "");
  } catch (error: unknown) {
    throw new Error(
      `Error: create new file ${filename} failed.\n${String(error)}\n`,
    );
  }
}

function _generateImageFilename(type: IConvertOptions["type"]) {
  const _now = new Date();
  const _outputFilenameSuffix = `${_now.getFullYear()}_${
    _now.getMonth() + 1
  }_${_now.getDate()}_${_now.getHours()}_${_now.getMinutes()}_${_now.getSeconds()}_${_now.getMilliseconds()}`;
  return `mdimg_${_outputFilenameSuffix}.${type}`;
}

export { mdimg, mdimg as convert2img };
