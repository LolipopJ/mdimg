/**
 * mdimg - convert markdown to image
 * Copyright (c) 2022-2022, LolipopJ. (MIT Licensed)
 * https://github.com/LolipopJ/mdimg
 */

import require$$0$1 from 'path';
import require$$1 from 'fs';
import require$$2$1 from 'puppeteer';
import require$$0 from 'marked';
import require$$2 from 'cheerio';

const { marked } = require$$0;

function parseMarkdown$1(mdText) {
  return marked.parse(mdText)
}

var mdParser = { parseMarkdown: parseMarkdown$1 };

const { resolve: resolve$1 } = require$$0$1;
const { readFileSync: readFileSync$1, accessSync, constants } = require$$1;
const cheerio = require$$2;

function spliceHtml$1(mdHtml, htmlTemplate, cssTemplate) {
  let _htmlPath = resolve$1(__dirname, '../template/html', `${htmlTemplate}.html`);
  let _cssPath = resolve$1(__dirname, '../template/css', `${cssTemplate}.css`);

  try {
    accessSync(_htmlPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `HTML template ${_htmlPath} is not found or unreadable. Use default HTML template.`
    );
    _htmlPath = resolve$1(__dirname, '../template/html/default.html');
  }
  try {
    accessSync(_cssPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `CSS template ${_htmlPath} is not found or unreadable. Use default CSS template.`
    );
    _cssPath = resolve$1(__dirname, '../template/css/default.css');
  }

  const _htmlSource = readFileSync$1(_htmlPath);
  const _cssSource = readFileSync$1(_cssPath);

  const $ = cheerio.load(_htmlSource);
  $('.markdown-body').html(mdHtml);

  const _html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mdimg</title>
    <style>
      ${_cssSource}
    </style>
  </head>
  <body>
    ${$.html()}
  </body>
  </html>`;

  return _html
}

var htmlSplicer = { spliceHtml: spliceHtml$1 };

const { resolve, dirname, basename } = require$$0$1;
const {
  existsSync,
  statSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} = require$$1;
const puppeteer = require$$2$1;

const { parseMarkdown } = mdParser;
const { spliceHtml } = htmlSplicer;

async function convert2img({
  mdText,
  mdFile,
  outputFilename,
  type = 'png',
  width = 800,
  height = 600,
  encoding = 'binary',
  quality,
  htmlTemplate = 'default',
  cssTemplate = 'default',
  log = false,
} = {}) {
  const _encodingTypes = ['base64', 'binary'];
  const _outputFileTypes = ['jpeg', 'png', 'webp'];
  const _result = {};

  // Resolve input file or text
  let _input = mdText;
  if (mdFile) {
    const _inputFilePath = resolve(mdFile);
    if (!existsSync(_inputFilePath)) {
      // Input is not exist
      throw new Error(`Input file ${_inputFilePath} is not exists.`)
    } else {
      if (!statSync(_inputFilePath).isFile()) {
        // Input is not a file
        throw new Error('Input is not a file.')
      } else {
        // Read text from input file
        _input = readFileSync(_inputFilePath, { encoding: 'utf-8' });
        if (log) {
          console.log(`Start to convert ${_inputFilePath} to an image.`);
        }
      }
    }
  } else if (!_input) {
    // There is no input text or file
    throw new Error('You must provide a text or a file to be converted.')
  }

  // Resolve encoding
  const _encoding = encoding;
  if (!_encodingTypes.includes(_encoding)) {
    // Params encoding is not valid
    throw new Error(
      `Encoding ${_encoding} is not supported. Valid values: 'base64' and 'binary'.`
    )
  }

  // Resolve type
  let _type = type;
  if (!_outputFileTypes.includes(_type)) {
    // Params encoding is not valid
    throw new Error(
      `Output file type ${_type} is not supported. Valid values: 'jpeg', 'png' and 'webp'.`
    )
  }

  // Resolve output filename
  let _output;
  if (_encoding === 'binary') {
    if (!outputFilename) {
      // Output filename is not specified
      // Set default output filename
      _output = resolve('mdimg_output', _generateImageFilename(_type));
    } else {
      // Check validation of ouput filename
      const _outputFilename = basename(outputFilename);
      const _outputFilePath = dirname(outputFilename);
      const _outputFilenameArr = _outputFilename.split('.');
      const _outputFilenameArrLeng = _outputFilenameArr.length;
      if (_outputFilenameArrLeng <= 1) {
        // Output file type is not specified
        _output = resolve(_outputFilePath, `_outputFilename.${_type}`);
      } else {
        // Output file type is specified
        const _outputFileType = _outputFilenameArr[_outputFilenameArrLeng - 1];
        if (!_outputFileTypes.includes(_outputFileType)) {
          // Output file type is wrongly specified
          console.warn(
            `Output file type must be one of 'jpeg', 'png' or 'webp'. Use '${_type}' type.`
          );
          _output = resolve(
            _outputFilePath,
            `${_outputFilenameArr[0]}.${_type}`
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
  if (_type !== 'png') {
    _quality = quality > 0 && quality <= 100 ? quality : 100;
  }

  // Parse markdown text to HTML
  const _html = spliceHtml(
    parseMarkdown(_input),
    _resolveTemplateName(htmlTemplate),
    _resolveTemplateName(cssTemplate)
  );
  _result.html = _html;

  // Launch headless browser to load HTML
  const _browser = await puppeteer.launch({
    defaultViewport: {
      width,
      height,
    },
    args: [`--window-size=${width},${height}`],
  });
  const _page = await _browser.newPage();
  await _page.setContent(_html, {
    waitUntil: 'networkidle0',
  });

  const _body = await _page.$('#mdimg-body');
  if (_body) {
    if (_encoding === 'binary') {
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
            _quality ? ' Iamge quality: ' + _quality : ''
          }\nFile: ${_output}`
        );
      }

      _result.data = _outputBuffer;
      _result.path = _output;
    } else if (_encoding === 'base64') {
      // Generate base64 encoded image
      const _outputBase64String = await _body.screenshot({
        type: _type,
        quality: _quality,
        encoding: _encoding,
      });
      if (log) {
        console.log(
          `Convert to BASE64 encoded string successfully!${
            _quality ? ' Iamge quality: ' + _quality : ''
          }\n${_outputBase64String}`
        );
      }

      _result.data = _outputBase64String;
    }

    await _browser.close();
    return _result
  } else {
    // HTML template is not valid
    await _browser.close();

    throw new Error(
      `Missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.`
    )
  }
}

function _resolveTemplateName(templateName) {
  const _templateName = templateName.split('.')[0];
  return _templateName
}

function _createEmptyFile(filename) {
  const _filePath = dirname(filename);

  try {
    mkdirSync(_filePath, { recursive: true });
    writeFileSync(filename, '');
  } catch (error) {
    throw new Error(`Create new file ${filename} failed.\n`, error)
  }
}

function _generateImageFilename(type) {
  const _now = new Date();
  const _outputFilenameSuffix = `${_now.getFullYear()}_${
    _now.getMonth() + 1
  }_${_now.getDate()}_${_now.getHours()}_${_now.getMinutes()}_${_now.getSeconds()}_${_now.getMilliseconds()}`;
  return `mdimg_${_outputFilenameSuffix}.${type}`
}

var mdimg = { convert2img };

export { mdimg as default };
