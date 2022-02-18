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
  let _htmlPath = resolve$1('src/template/html', `${htmlTemplate}.html`);
  let _cssPath = resolve$1('src/template/css', `${cssTemplate}.css`);

  try {
    accessSync(_htmlPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `HTML template file ${_htmlPath} is not found. Use default HTML template.`
    );
    _htmlPath = resolve$1('src/template/html/default.html');
  }
  try {
    accessSync(_cssPath, constants.R_OK);
  } catch (err) {
    console.warn(
      `CSS template file ${_htmlPath} is not found. Use default CSS template.`
    );
    _cssPath = resolve$1('src/template/css/default.css');
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
  htmlTemplate = 'default',
  cssTemplate = 'default',
  width = 800,
  height = 600,
  encoding = 'binary',
  outputFilename,
  log = false,
} = {}) {
  const _encodingType = ['base64', 'binary'];
  const _outputFileType = ['jpeg', 'png', 'webp'];
  const _result = {};

  let _input = mdText;
  let _output;

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
      }
    }
  } else if (!mdText) {
    // There is no input text or file
    throw new Error('You must provide a text or a file to be converted.')
  }

  if (!_encodingType.includes(encoding)) {
    // Params encoding is not valid
    throw new Error(
      `Encoding ${encoding} is not supported. Valid values: 'base64' and 'binary'.`
    )
  }

  if (encoding === 'binary') {
    if (!outputFilename) {
      // Set default output filename
      _output = resolve('mdimg_output', _generateImageFilename());
    } else {
      // Check validation of ouput filename
      const _outputFilename = basename(outputFilename);
      const _outputFilePath = dirname(outputFilename);
      const _outputFilenameArr = _outputFilename.split('.');
      if (_outputFilenameArr.length <= 1) {
        // Output file type is not specified
        _output = resolve(_outputFilePath, _outputFilename + '.png');
      } else if (
        !_outputFileType.includes(
          _outputFilenameArr[_outputFilenameArr.length - 1]
        )
      ) {
        // Output file type is wrongly specified
        throw new Error(
          "Output file type must be one of 'jpeg', 'png' or 'webp'"
        )
      } else {
        // Set absolute file path
        _output = resolve(outputFilename);
      }
    }
  }

  // Parse markdown text to HTML
  const _html = spliceHtml(parseMarkdown(_input), htmlTemplate, cssTemplate);
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
    if (encoding === 'binary') {
      // Create empty output file
      _createEmptyFile(_output);

      // Generate output image
      await _body.screenshot({
        path: _output,
        encoding,
      });
      if (log) {
        console.log(`Convert to image successfully!\nFile: ${_output}`);
      }

      await _browser.close();

      _result.data = _output;
      return _result
    } else if (encoding === 'base64') {
      const _outputBase64String = await _body.screenshot({
        encoding,
      });
      if (log) {
        console.log(
          `Convert to base64 string successfully!\n${_outputBase64String}`
        );
      }

      await _browser.close();

      _result.data = _outputBase64String;
      return _result
    }
  } else {
    await _browser.close();

    // HTML template is not valid
    throw new Error(
      `Missing HTML element with id: mdimg-body.\nHTML template ${htmlTemplate} is not valid.`
    )
  }
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

function _generateImageFilename() {
  const _now = new Date();
  const _outputFilenameSuffix = `${_now.getFullYear()}_${
    _now.getMonth() + 1
  }_${_now.getDate()}_${_now.getHours()}_${_now.getMinutes()}_${_now.getSeconds()}_${_now.getMilliseconds()}`;
  return `mdimg_${_outputFilenameSuffix}.png`
}

var mdimg = { convert2img };

export { mdimg as default };
