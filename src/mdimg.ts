import { resolve, dirname, basename } from "path";
import {
  existsSync,
  statSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import puppeteer from "puppeteer";

import { parseMarkdown } from "./mdParser";
import { spliceHtml } from "./htmlSplicer";

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
}: IConvertOptions) => {
  const _outputFileTypes: IConvertTypeOption[] = ["jpeg", "png", "webp"];
  const _encodingTypes: IConvertEncodingOption[] = ["base64", "binary"];
  const _result: IConvertResponse = { data: "", html: "" };

  // Resolve input file or text
  let _input = inputText || mdText;
  const _inputFilename = inputFilename || mdFile;
  if (_inputFilename) {
    const _inputFilePath = resolve(_inputFilename);
    if (!existsSync(_inputFilePath)) {
      // Input is not exist
      throw new Error(`Input file ${_inputFilePath} is not exists.`);
    } else {
      if (!statSync(_inputFilePath).isFile()) {
        // Input is not a file
        throw new Error("Input is not a file.");
      } else {
        // Read text from input file
        _input = readFileSync(_inputFilePath, { encoding: "utf-8" });
        if (log) {
          console.log(`Start to convert ${_inputFilePath} to an image.`);
        }
      }
    }
  } else if (!_input) {
    // There is no input text or file
    throw new Error("You must provide a text or a file to be converted.");
  }

  // Resolve encoding
  const _encoding = encoding;
  if (!_encodingTypes.includes(_encoding)) {
    // Params encoding is not valid
    throw new Error(
      `Encoding ${_encoding} is not supported. Valid values: 'base64' and 'binary'.`,
    );
  }

  // Resolve output file type
  let _type = type;
  if (!_outputFileTypes.includes(_type)) {
    // Params encoding is not valid
    throw new Error(
      `Output file type ${_type} is not supported. Valid values: 'jpeg', 'png' and 'webp'.`,
    );
  }

  // Resolve output filename
  let _output = "";
  if (_encoding === "binary") {
    if (!outputFilename) {
      // Output filename is not specified
      // Set default output filename
      _output = resolve("mdimg_output", _generateImageFilename(_type));
    } else {
      // Check validation of ouput filename
      const _outputFilename = basename(outputFilename);
      const _outputFilePath = dirname(outputFilename);
      const _outputFilenameArr = _outputFilename.split(".");
      const _outputFilenameArrLeng = _outputFilenameArr.length;
      if (_outputFilenameArrLeng <= 1) {
        // Output file type is not specified
        _output = resolve(_outputFilePath, `_outputFilename.${_type}`);
      } else {
        // Output file type is specified
        const _outputFileType = _outputFilenameArr[
          _outputFilenameArrLeng - 1
        ] as IConvertTypeOption;
        if (!_outputFileTypes.includes(_outputFileType)) {
          // Output file type is wrongly specified
          console.warn(
            `Output file type must be one of 'jpeg', 'png' or 'webp'. Use '${_type}' type.`,
          );
          _output = resolve(
            _outputFilePath,
            `${_outputFilenameArr[0]}.${_type}`,
          );
        } else {
          // Output file path is correctly specified
          _output = resolve(outputFilename);
          // Option type is overrided
          _type = _outputFileType;
        }
      }
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
    if (_encoding === "binary") {
      // Create empty output file
      _createEmptyFile(_output);

      // Generate output image
      const _outputBuffer = await _body.screenshot({
        path: _output,
        quality: _quality,
        encoding: _encoding,
      });
      if (log) {
        console.log(
          `Convert to image successfully!${
            _quality ? " Iamge quality: " + _quality : ""
          }\nFile: ${_output}`,
        );
      }

      _result.data = _outputBuffer;
      _result.path = _output;
    } else if (_encoding === "base64") {
      // Generate base64 encoded image
      const _outputBase64String = await _body.screenshot({
        type: _type,
        quality: _quality,
        encoding: _encoding,
      });
      if (log) {
        console.log(
          `Convert to BASE64 encoded string successfully!${
            _quality ? " Iamge quality: " + _quality : ""
          }\n${_outputBase64String}`,
        );
      }

      _result.data = _outputBase64String;
    }

    await _browser.close();
    return _result;
  } else {
    // HTML template is not valid
    await _browser.close();

    throw new Error(
      `Missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.`,
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
    throw new Error(`Create new file ${filename} failed.\n` + String(error));
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
