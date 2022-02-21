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
        outputFilename,
        _ref$type,
        type,
        _ref$width,
        width,
        _ref$height,
        height,
        _ref$encoding,
        encoding,
        quality,
        _ref$htmlTemplate,
        htmlTemplate,
        _ref$cssTemplate,
        cssTemplate,
        _ref$log,
        log,
        _encodingTypes,
        _outputFileTypes,
        _result,
        _input,
        _inputFilePath,
        _encoding,
        _type,
        _output,
        _outputFilename,
        _outputFilePath,
        _outputFilenameArr,
        _outputFilenameArrLeng,
        _outputFileType,
        _quality,
        _html,
        _browser,
        _page,
        _body,
        _outputBuffer,
        _outputBase64String,
        _args = arguments;

    return _regeneratorRuntime__default["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, mdText = _ref.mdText, mdFile = _ref.mdFile, outputFilename = _ref.outputFilename, _ref$type = _ref.type, type = _ref$type === void 0 ? 'png' : _ref$type, _ref$width = _ref.width, width = _ref$width === void 0 ? 800 : _ref$width, _ref$height = _ref.height, height = _ref$height === void 0 ? 600 : _ref$height, _ref$encoding = _ref.encoding, encoding = _ref$encoding === void 0 ? 'binary' : _ref$encoding, quality = _ref.quality, _ref$htmlTemplate = _ref.htmlTemplate, htmlTemplate = _ref$htmlTemplate === void 0 ? 'default' : _ref$htmlTemplate, _ref$cssTemplate = _ref.cssTemplate, cssTemplate = _ref$cssTemplate === void 0 ? 'default' : _ref$cssTemplate, _ref$log = _ref.log, log = _ref$log === void 0 ? false : _ref$log;
            _encodingTypes = ['base64', 'binary'];
            _outputFileTypes = ['jpeg', 'png', 'webp'];
            _result = {}; // Resolve input file or text

            _input = mdText;

            if (!mdFile) {
              _context.next = 19;
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

            if (log) {
              console.log("Start to convert ".concat(_inputFilePath, " to an image."));
            }

          case 17:
            _context.next = 21;
            break;

          case 19:
            if (_input) {
              _context.next = 21;
              break;
            }

            throw new Error('You must provide a text or a file to be converted.');

          case 21:
            // Resolve encoding
            _encoding = encoding;

            if (_encodingTypes.includes(_encoding)) {
              _context.next = 24;
              break;
            }

            throw new Error("Encoding ".concat(_encoding, " is not supported. Valid values: 'base64' and 'binary'."));

          case 24:
            // Resolve type
            _type = type;

            if (_outputFileTypes.includes(_type)) {
              _context.next = 27;
              break;
            }

            throw new Error("Output file type ".concat(_type, " is not supported. Valid values: 'jpeg', 'png' and 'webp'."));

          case 27:
            if (_encoding === 'binary') {
              if (!outputFilename) {
                // Output filename is not specified
                // Set default output filename
                _output = resolve('mdimg_output', _generateImageFilename(_type));
              } else {
                // Check validation of ouput filename
                _outputFilename = basename(outputFilename);
                _outputFilePath = dirname(outputFilename);
                _outputFilenameArr = _outputFilename.split('.');
                _outputFilenameArrLeng = _outputFilenameArr.length;

                if (_outputFilenameArrLeng <= 1) {
                  // Output file type is not specified
                  _output = resolve(_outputFilePath, "_outputFilename.".concat(_type));
                } else {
                  // Output file type is specified
                  _outputFileType = _outputFilenameArr[_outputFilenameArrLeng - 1];

                  if (!_outputFileTypes.includes(_outputFileType)) {
                    // Output file type is wrongly specified
                    console.warn("Output file type must be one of 'jpeg', 'png' or 'webp'. Use '".concat(_type, "' type."));
                    _output = resolve(_outputFilePath, "".concat(_outputFilenameArr[0], ".").concat(_type));
                  } else {
                    // Output file path is correctly specified
                    _output = resolve(outputFilename); // Option type is overrided

                    _type = _outputFileType;
                  }
                }
              }
            } // Resolve quality


            if (_type !== 'png') {
              _quality = quality > 0 && quality <= 100 ? quality : 100;
            } // Parse markdown text to HTML


            _html = spliceHtml(parseMarkdown(_input), _resolveTemplateName(htmlTemplate), _resolveTemplateName(cssTemplate));
            _result.html = _html; // Launch headless browser to load HTML

            _context.next = 33;
            return puppeteer.launch({
              defaultViewport: {
                width: width,
                height: height
              },
              args: ["--window-size=".concat(width, ",").concat(height)]
            });

          case 33:
            _browser = _context.sent;
            _context.next = 36;
            return _browser.newPage();

          case 36:
            _page = _context.sent;
            _context.next = 39;
            return _page.setContent(_html, {
              waitUntil: 'networkidle0'
            });

          case 39:
            _context.next = 41;
            return _page.$('#mdimg-body');

          case 41:
            _body = _context.sent;

            if (!_body) {
              _context.next = 64;
              break;
            }

            if (!(_encoding === 'binary')) {
              _context.next = 53;
              break;
            }

            // Create empty output file
            _createEmptyFile(_output); // Generate output image


            _context.next = 47;
            return _body.screenshot({
              path: _output,
              quality: _quality,
              encoding: _encoding
            });

          case 47:
            _outputBuffer = _context.sent;

            if (log) {
              console.log("Convert to image successfully!".concat(_quality ? ' Iamge quality: ' + _quality : '', "\nFile: ").concat(_output));
            }

            _result.data = _outputBuffer;
            _result.path = _output;
            _context.next = 59;
            break;

          case 53:
            if (!(_encoding === 'base64')) {
              _context.next = 59;
              break;
            }

            _context.next = 56;
            return _body.screenshot({
              type: _type,
              quality: _quality,
              encoding: _encoding
            });

          case 56:
            _outputBase64String = _context.sent;

            if (log) {
              console.log("Convert to BASE64 encoded string successfully!".concat(_quality ? ' Iamge quality: ' + _quality : '', "\n").concat(_outputBase64String));
            }

            _result.data = _outputBase64String;

          case 59:
            _context.next = 61;
            return _browser.close();

          case 61:
            return _context.abrupt("return", _result);

          case 64:
            _context.next = 66;
            return _browser.close();

          case 66:
            throw new Error("Missing HTML element with id: mdimg-body.\nHTML template ".concat(htmlTemplate, " is not valid."));

          case 67:
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

function _generateImageFilename(type) {
  var _now = new Date();

  var _outputFilenameSuffix = "".concat(_now.getFullYear(), "_").concat(_now.getMonth() + 1, "_").concat(_now.getDate(), "_").concat(_now.getHours(), "_").concat(_now.getMinutes(), "_").concat(_now.getSeconds(), "_").concat(_now.getMilliseconds());

  return "mdimg_".concat(_outputFilenameSuffix, ".").concat(type);
}

var mdimg = {
  convert2img: convert2img
};

module.exports = mdimg;
