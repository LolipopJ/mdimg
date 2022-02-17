/**
 * mdimg - convert markdown to image
 * Copyright (c) 2022-2022, LolipopJ. (MIT Licensed)
 * https://github.com/LolipopJ/mdimg
 */

'use strict';

var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _regeneratorRuntime = require('@babel/runtime/regenerator');
var require$$0$1 = require('path');
var require$$1 = require('fs');
var require$$2$1 = require('puppeteer');
var require$$0 = require('marked');
var require$$2 = require('cheerio');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var require$$0__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$0$1);
var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);
var require$$2__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$2$1);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var require$$2__default = /*#__PURE__*/_interopDefaultLegacy(require$$2);

var marked = require$$0__default["default"].marked;

function parseMarkdown$1(mdText) {
  return marked.parse(mdText);
}

var mdParser = {
  parseMarkdown: parseMarkdown$1
};

var join = require$$0__default$1["default"].join;
var readFileSync$1 = require$$1__default["default"].readFileSync;
var cheerio = require$$2__default["default"];

function spliceHtml$1(mdHtml, htmlTemplate, cssTemplate) {
  var _htmlPath = join('src/template/html', htmlTemplate + ".html");

  var _cssPath = join('src/template/css', cssTemplate + ".css");

  var _htmlSource = readFileSync$1(_htmlPath);

  var _cssSource = readFileSync$1(_cssPath);

  var $ = cheerio.load(_htmlSource);
  $('.markdown-body').html(mdHtml);

  var _html = "\n  <!DOCTYPE html>\n  <html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>mdimg</title>\n    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css\">\n    <style>\n      " + _cssSource + "\n    </style>\n  </head>\n  <body>\n    " + $.html() + "\n  </body>\n  </html>";

  return _html;
}

var htmlSplicer = {
  spliceHtml: spliceHtml$1
};

var resolve = require$$0__default$1["default"].resolve,
    dirname = require$$0__default$1["default"].dirname,
    basename = require$$0__default$1["default"].basename;
var existsSync = require$$1__default["default"].existsSync,
    statSync = require$$1__default["default"].statSync,
    readFileSync = require$$1__default["default"].readFileSync,
    mkdirSync = require$$1__default["default"].mkdirSync,
    writeFileSync = require$$1__default["default"].writeFileSync;
var puppeteer = require$$2__default$1["default"];
var parseMarkdown = mdParser.parseMarkdown;
var spliceHtml = htmlSplicer.spliceHtml;

function convert2img(_x) {
  return _convert2img.apply(this, arguments);
}

function _convert2img() {
  _convert2img = _asyncToGenerator__default["default"]( /*#__PURE__*/_regeneratorRuntime__default["default"].mark(function _callee(_temp) {
    var _ref, mdText, mdFile, _ref$htmlTemplate, htmlTemplate, _ref$cssTemplate, cssTemplate, _ref$width, width, _ref$height, height, _ref$encoding, encoding, outputFileName, _ref$log, log, _encodingType, _outputFileType, _result, _input, _output, _inputFilePath, _outputFileName, _outputFilePath, _outputFileNameArr, _html, _browser, _page, _body, _outputBase64String;

    return _regeneratorRuntime__default["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref = _temp === void 0 ? {} : _temp, mdText = _ref.mdText, mdFile = _ref.mdFile, _ref$htmlTemplate = _ref.htmlTemplate, htmlTemplate = _ref$htmlTemplate === void 0 ? 'default' : _ref$htmlTemplate, _ref$cssTemplate = _ref.cssTemplate, cssTemplate = _ref$cssTemplate === void 0 ? 'default' : _ref$cssTemplate, _ref$width = _ref.width, width = _ref$width === void 0 ? 800 : _ref$width, _ref$height = _ref.height, height = _ref$height === void 0 ? 600 : _ref$height, _ref$encoding = _ref.encoding, encoding = _ref$encoding === void 0 ? 'binary' : _ref$encoding, outputFileName = _ref.outputFileName, _ref$log = _ref.log, log = _ref$log === void 0 ? false : _ref$log;
            _encodingType = ['base64', 'binary'];
            _outputFileType = ['jpeg', 'png', 'webp'];
            _result = {};
            _input = mdText;

            if (!mdFile) {
              _context.next = 18;
              break;
            }

            _inputFilePath = resolve(mdFile);

            if (existsSync(_inputFilePath)) {
              _context.next = 11;
              break;
            }

            throw new Error('Input file is not exists.');

          case 11:
            if (statSync(_inputFilePath).isFile()) {
              _context.next = 15;
              break;
            }

            throw new Error('Input is not a file.');

          case 15:
            // Read text from input file
            _input = readFileSync(_inputFilePath, {
              encoding: 'utf-8'
            });

          case 16:
            _context.next = 20;
            break;

          case 18:
            if (mdText) {
              _context.next = 20;
              break;
            }

            throw new Error('You must provide a text or a file to be converted.');

          case 20:
            if (_encodingType.includes(encoding)) {
              _context.next = 22;
              break;
            }

            throw new Error("Encoding " + encoding + " is not supported. Valid values: 'base64' and 'binary'.");

          case 22:
            if (!(encoding === 'binary')) {
              _context.next = 39;
              break;
            }

            if (outputFileName) {
              _context.next = 27;
              break;
            }

            // Set default output file name
            _output = resolve('mdimg_output', _generateImageFileName());
            _context.next = 39;
            break;

          case 27:
            // Check validation of ouput file name
            _outputFileName = basename(outputFileName);
            _outputFilePath = dirname(outputFileName);
            _outputFileNameArr = _outputFileName.split('.');

            if (!(_outputFileNameArr.length <= 1)) {
              _context.next = 34;
              break;
            }

            // Output file type is not specified
            _output = resolve(_outputFilePath, _outputFileName + '.png');
            _context.next = 39;
            break;

          case 34:
            if (_outputFileType.includes(_outputFileNameArr[_outputFileNameArr.length - 1])) {
              _context.next = 38;
              break;
            }

            throw new Error("Output file type must be one of 'jpeg', 'png' or 'webp'");

          case 38:
            // Set absolute file path
            _output = resolve(outputFileName);

          case 39:
            // Parse markdown text to HTML
            _html = spliceHtml(parseMarkdown(_input), htmlTemplate, cssTemplate);
            _result.html = _html; // Launch headless browser to load HTML

            _context.next = 43;
            return puppeteer.launch({
              defaultViewport: {
                width: width,
                height: height
              },
              args: ["--window-size=" + width + "," + height]
            });

          case 43:
            _browser = _context.sent;
            _context.next = 46;
            return _browser.newPage();

          case 46:
            _page = _context.sent;
            _context.next = 49;
            return _page.setContent(_html, {
              waitUntil: 'networkidle0'
            });

          case 49:
            _context.next = 51;
            return _page.$('#mdimg-body');

          case 51:
            _body = _context.sent;

            if (!_body) {
              _context.next = 75;
              break;
            }

            if (!(encoding === 'binary')) {
              _context.next = 64;
              break;
            }

            // Create empty output file
            _createEmptyFile(_output); // Generate output image


            _context.next = 57;
            return _body.screenshot({
              path: _output,
              encoding: encoding
            });

          case 57:
            if (log) {
              console.log("Convert to image successfully!\nFile: " + _output);
            }

            _context.next = 60;
            return _browser.close();

          case 60:
            _result.data = _output;
            return _context.abrupt("return", _result);

          case 64:
            if (!(encoding === 'base64')) {
              _context.next = 73;
              break;
            }

            _context.next = 67;
            return _body.screenshot({
              encoding: encoding
            });

          case 67:
            _outputBase64String = _context.sent;

            if (log) {
              console.log("Convert to base64 string successfully!\n" + _outputBase64String);
            }

            _context.next = 71;
            return _browser.close();

          case 71:
            _result.data = _outputBase64String;
            return _context.abrupt("return", _result);

          case 73:
            _context.next = 78;
            break;

          case 75:
            _context.next = 77;
            return _browser.close();

          case 77:
            throw new Error("Missing HTML element with id: mdimg-body.\nHTML template " + htmlTemplate + " is not valid.");

          case 78:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _convert2img.apply(this, arguments);
}

function _createEmptyFile(fileName) {
  var _filePath = dirname(fileName);

  try {
    mkdirSync(_filePath, {
      recursive: true
    });
    writeFileSync(fileName, '');
  } catch (error) {
    throw new Error("Create new file " + fileName + " failed.\n", error);
  }
}

function _generateImageFileName() {
  var _now = new Date();

  var _outputFileNameSuffix = _now.getFullYear() + "_" + (_now.getMonth() + 1) + "_" + _now.getDate() + "_" + _now.getHours() + "_" + _now.getMinutes() + "_" + _now.getSeconds() + "_" + _now.getMilliseconds();

  return "mdimg_" + _outputFileNameSuffix + ".png";
}

var mdimg = {
  convert2img: convert2img
};

module.exports = mdimg;
