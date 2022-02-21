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
var require$$2$1 = require('string');
var require$$3 = require('puppeteer');
var require$$0 = require('marked');
var require$$2 = require('cheerio');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var require$$0__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$0$1);
var require$$1__default = /*#__PURE__*/_interopDefaultLegacy(require$$1);
var require$$2__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$2$1);
var require$$3__default = /*#__PURE__*/_interopDefaultLegacy(require$$3);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var require$$2__default = /*#__PURE__*/_interopDefaultLegacy(require$$2);

var marked = require$$0__default["default"].marked;

function parseMarkdown$1(mdText) {
  return marked.parse(mdText);
}

var mdParser = {
  parseMarkdown: parseMarkdown$1
};

var resolve$1 = require$$0__default$1["default"].resolve;
var readFileSync$1 = require$$1__default["default"].readFileSync,
    accessSync = require$$1__default["default"].accessSync,
    constants = require$$1__default["default"].constants;
var cheerio = require$$2__default["default"];

function spliceHtml$1(mdHtml, htmlTemplate, cssTemplate) {
  var _htmlPath = resolve$1(__dirname, '../template/html', "".concat(htmlTemplate, ".html"));

  var _cssPath = resolve$1(__dirname, '../template/css', "".concat(cssTemplate, ".css"));

  try {
    accessSync(_htmlPath, constants.R_OK);
  } catch (err) {
    console.warn("HTML template ".concat(_htmlPath, " is not found or unreadable. Use default HTML template."));
    _htmlPath = resolve$1(__dirname, '../template/html/default.html');
  }

  try {
    accessSync(_cssPath, constants.R_OK);
  } catch (err) {
    console.warn("CSS template ".concat(_htmlPath, " is not found or unreadable. Use default CSS template."));
    _cssPath = resolve$1(__dirname, '../template/css/default.css');
  }

  var _htmlSource = readFileSync$1(_htmlPath);

  var _cssSource = readFileSync$1(_cssPath);

  var $ = cheerio.load(_htmlSource);
  $('.markdown-body').html(mdHtml);

  var _html = "\n  <!DOCTYPE html>\n  <html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>mdimg</title>\n    <style>\n      ".concat(_cssSource, "\n    </style>\n  </head>\n  <body>\n    ").concat($.html(), "\n  </body>\n  </html>");

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
var S = require$$2__default$1["default"];
var puppeteer = require$$3__default["default"];
var parseMarkdown = mdParser.parseMarkdown;
var spliceHtml = htmlSplicer.spliceHtml;

function convert2img() {
  return _convert2img.apply(this, arguments);
}

function _convert2img() {
  _convert2img = _asyncToGenerator__default["default"]( /*#__PURE__*/_regeneratorRuntime__default["default"].mark(function _callee() {
    var _ref,
        mdText,
        mdFile,
        _ref$htmlTemplate,
        htmlTemplate,
        _ref$cssTemplate,
        cssTemplate,
        _ref$width,
        width,
        _ref$height,
        height,
        _ref$encoding,
        encoding,
        outputFilename,
        _ref$log,
        log,
        _encodingType,
        _outputFileType,
        _result,
        _input,
        _output,
        _inputFilePath,
        _outputFilename,
        _outputFilePath,
        _outputFilenameArr,
        _html,
        _browser,
        _page,
        _body,
        _outputBase64String,
        _args = arguments;

    return _regeneratorRuntime__default["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, mdText = _ref.mdText, mdFile = _ref.mdFile, _ref$htmlTemplate = _ref.htmlTemplate, htmlTemplate = _ref$htmlTemplate === void 0 ? 'default' : _ref$htmlTemplate, _ref$cssTemplate = _ref.cssTemplate, cssTemplate = _ref$cssTemplate === void 0 ? 'default' : _ref$cssTemplate, _ref$width = _ref.width, width = _ref$width === void 0 ? 800 : _ref$width, _ref$height = _ref.height, height = _ref$height === void 0 ? 600 : _ref$height, _ref$encoding = _ref.encoding, encoding = _ref$encoding === void 0 ? 'binary' : _ref$encoding, outputFilename = _ref.outputFilename, _ref$log = _ref.log, log = _ref$log === void 0 ? false : _ref$log;
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

            throw new Error("Input file ".concat(_inputFilePath, " is not exists."));

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

            throw new Error("Encoding ".concat(encoding, " is not supported. Valid values: 'base64' and 'binary'."));

          case 22:
            // Resolve output filename
            if (encoding === 'binary') {
              if (!outputFilename) {
                // Set default output filename
                _output = resolve('mdimg_output', _generateImageFilename());
              } else {
                // Check validation of ouput filename
                _outputFilename = basename(outputFilename);
                _outputFilePath = dirname(outputFilename);
                _outputFilenameArr = _outputFilename.split('.');

                if (_outputFilenameArr.length <= 1) {
                  // Output file type is not specified
                  _output = resolve(_outputFilePath, _outputFilename + '.png');
                } else if (!_outputFileType.includes(_outputFilenameArr[_outputFilenameArr.length - 1])) {
                  // Output file type is wrongly specified
                  console.warn("Output file type must be one of 'jpeg', 'png' or 'webp'. Use default 'png' type.");
                  _output = resolve(_outputFilePath, _outputFilenameArr[0] + '.png');
                } else {
                  // Set absolute file path
                  _output = resolve(outputFilename);
                }
              }
            } // Parse markdown text to HTML


            _html = spliceHtml(parseMarkdown(_input), _resolveTemplateName(htmlTemplate), _resolveTemplateName(cssTemplate));
            _result.html = _html; // Launch headless browser to load HTML

            _context.next = 27;
            return puppeteer.launch({
              defaultViewport: {
                width: width,
                height: height
              },
              args: ["--window-size=".concat(width, ",").concat(height)]
            });

          case 27:
            _browser = _context.sent;
            _context.next = 30;
            return _browser.newPage();

          case 30:
            _page = _context.sent;
            _context.next = 33;
            return _page.setContent(_html, {
              waitUntil: 'networkidle0'
            });

          case 33:
            _context.next = 35;
            return _page.$('#mdimg-body');

          case 35:
            _body = _context.sent;

            if (!_body) {
              _context.next = 59;
              break;
            }

            if (!(encoding === 'binary')) {
              _context.next = 48;
              break;
            }

            // Create empty output file
            _createEmptyFile(_output); // Generate output image


            _context.next = 41;
            return _body.screenshot({
              path: _output,
              encoding: encoding
            });

          case 41:
            if (log) {
              console.log("Convert to image successfully!\nFile: ".concat(_output));
            }

            _context.next = 44;
            return _browser.close();

          case 44:
            _result.data = _output;
            return _context.abrupt("return", _result);

          case 48:
            if (!(encoding === 'base64')) {
              _context.next = 57;
              break;
            }

            _context.next = 51;
            return _body.screenshot({
              encoding: encoding
            });

          case 51:
            _outputBase64String = _context.sent;

            if (log) {
              console.log("Convert to base64 string successfully!\n".concat(_outputBase64String));
            }

            _context.next = 55;
            return _browser.close();

          case 55:
            _result.data = _outputBase64String;
            return _context.abrupt("return", _result);

          case 57:
            _context.next = 62;
            break;

          case 59:
            _context.next = 61;
            return _browser.close();

          case 61:
            throw new Error("Missing HTML element with id: mdimg-body.\nHTML template ".concat(htmlTemplate, " is not valid."));

          case 62:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _convert2img.apply(this, arguments);
}

function _resolveTemplateName(templateName) {
  var _templateName = templateName.split('.')[0]; // Convert to lower camel case

  return S(_templateName).camelize().s;
}

function _createEmptyFile(filename) {
  var _filePath = dirname(filename);

  try {
    mkdirSync(_filePath, {
      recursive: true
    });
    writeFileSync(filename, '');
  } catch (error) {
    throw new Error("Create new file ".concat(filename, " failed.\n"), error);
  }
}

function _generateImageFilename() {
  var _now = new Date();

  var _outputFilenameSuffix = "".concat(_now.getFullYear(), "_").concat(_now.getMonth() + 1, "_").concat(_now.getDate(), "_").concat(_now.getHours(), "_").concat(_now.getMinutes(), "_").concat(_now.getSeconds(), "_").concat(_now.getMilliseconds());

  return "mdimg_".concat(_outputFilenameSuffix, ".png");
}

var mdimg = {
  convert2img: convert2img
};

module.exports = mdimg;
