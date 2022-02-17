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

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

var marked = require$$0.marked;

function parseMarkdown$1(mdText) {
  return marked.parse(mdText);
}

var mdParser = {
  parseMarkdown: parseMarkdown$1
};

var join = require$$0$1.join;
var readFileSync$1 = require$$1.readFileSync;
var cheerio = require$$2;

function spliceHtml$1(mdHtml, htmlTemplate, cssTemplate) {
  var htmlPath = join('src/template/html', "".concat(htmlTemplate, ".html"));
  var cssPath = join('src/template/css', "".concat(cssTemplate, ".css"));
  var htmlSource = readFileSync$1(htmlPath);
  var cssSource = readFileSync$1(cssPath);
  var $ = cheerio.load(htmlSource);
  $('.markdown-body').html(mdHtml);
  var html = "\n  <!DOCTYPE html>\n  <html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>mdimg</title>\n    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css\">\n    <style>\n      ".concat(cssSource, "\n    </style>\n  </head>\n  <body>\n    ").concat($.html(), "\n  </body>\n  </html>");
  return html;
}

var htmlSplicer = {
  spliceHtml: spliceHtml$1
};

var resolve = require$$0$1.resolve,
    dirname = require$$0$1.dirname;
var existsSync = require$$1.existsSync,
    statSync = require$$1.statSync,
    readFileSync = require$$1.readFileSync,
    mkdirSync = require$$1.mkdirSync,
    writeFileSync = require$$1.writeFileSync;
var puppeteer = require$$2$1;
var parseMarkdown = mdParser.parseMarkdown;
var spliceHtml = htmlSplicer.spliceHtml;

function convert2img() {
  return _convert2img.apply(this, arguments);
}

function _convert2img() {
  _convert2img = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
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
        outputFileName,
        input,
        output,
        result,
        inputFilePath,
        encodingType,
        now,
        outputFileNameSuffix,
        html,
        browser,
        page,
        body,
        outputBase64String,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, mdText = _ref.mdText, mdFile = _ref.mdFile, _ref$htmlTemplate = _ref.htmlTemplate, htmlTemplate = _ref$htmlTemplate === void 0 ? 'default' : _ref$htmlTemplate, _ref$cssTemplate = _ref.cssTemplate, cssTemplate = _ref$cssTemplate === void 0 ? 'default' : _ref$cssTemplate, _ref$width = _ref.width, width = _ref$width === void 0 ? 800 : _ref$width, _ref$height = _ref.height, height = _ref$height === void 0 ? 600 : _ref$height, _ref$encoding = _ref.encoding, encoding = _ref$encoding === void 0 ? 'binary' : _ref$encoding, outputFileName = _ref.outputFileName;
            input = mdText;
            result = {};

            if (!mdFile) {
              _context.next = 16;
              break;
            }

            inputFilePath = resolve(mdFile);

            if (existsSync(inputFilePath)) {
              _context.next = 9;
              break;
            }

            throw new Error('Input file is not exists.');

          case 9:
            if (statSync(inputFilePath).isFile()) {
              _context.next = 13;
              break;
            }

            throw new Error('Input is not a file.');

          case 13:
            // Read text from input file
            input = readFileSync(inputFilePath, {
              encoding: 'utf-8'
            });

          case 14:
            _context.next = 18;
            break;

          case 16:
            if (mdText) {
              _context.next = 18;
              break;
            }

            throw new Error('You must provide a text or a file to be converted.');

          case 18:
            encodingType = ['base64', 'binary'];

            if (encodingType.includes(encoding)) {
              _context.next = 21;
              break;
            }

            throw new Error("Encoding ".concat(encoding, " is not supported. Valid values: 'base64' and 'binary'."));

          case 21:
            if (encoding === 'binary') {
              if (!outputFileName) {
                // Set default output file name
                now = new Date();
                outputFileNameSuffix = "".concat(now.getFullYear(), "_").concat(now.getMonth() + 1, "_").concat(now.getDate(), "_").concat(now.getHours(), "_").concat(now.getMinutes(), "_").concat(now.getSeconds(), "_").concat(now.getMilliseconds());
                output = resolve('mdimg_output', "mdimg_".concat(outputFileNameSuffix, ".png"));
              } else {
                output = resolve(outputFileName);
              }
            } // Parse markdown text to HTML


            html = spliceHtml(parseMarkdown(input), htmlTemplate, cssTemplate);
            result.html = html; // Launch headless browser to load HTML

            _context.next = 26;
            return puppeteer.launch({
              defaultViewport: {
                width: width,
                height: height
              },
              args: ["--window-size=".concat(width, ",").concat(height)]
            });

          case 26:
            browser = _context.sent;
            _context.next = 29;
            return browser.newPage();

          case 29:
            page = _context.sent;
            _context.next = 32;
            return page.setContent(html, {
              waitUntil: 'networkidle0'
            });

          case 32:
            _context.next = 34;
            return page.$('#mdimg-body');

          case 34:
            body = _context.sent;

            if (!body) {
              _context.next = 57;
              break;
            }

            if (!(encoding === 'binary')) {
              _context.next = 47;
              break;
            }

            if (createEmptyFile(output)) {
              _context.next = 39;
              break;
            }

            throw new Error("Create new file ".concat(output, " failed."));

          case 39:
            _context.next = 41;
            return body.screenshot({
              path: output,
              encoding: encoding
            });

          case 41:
            result.data = output;
            _context.next = 44;
            return browser.close();

          case 44:
            return _context.abrupt("return", result);

          case 47:
            if (!(encoding === 'base64')) {
              _context.next = 55;
              break;
            }

            _context.next = 50;
            return body.screenshot({
              encoding: encoding
            });

          case 50:
            outputBase64String = _context.sent;
            result.data = outputBase64String;
            _context.next = 54;
            return browser.close();

          case 54:
            return _context.abrupt("return", result);

          case 55:
            _context.next = 60;
            break;

          case 57:
            _context.next = 59;
            return browser.close();

          case 59:
            throw new Error("Missing HTML element with id: mdimg-body.\nHTML template ".concat(htmlTemplate, " is not valid."));

          case 60:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _convert2img.apply(this, arguments);
}

function createEmptyFile(fileName) {
  var filePath = dirname(fileName);

  try {
    mkdirSync(filePath, {
      recursive: true
    });
    writeFileSync(fileName, '');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

var mdimg = {
  convert2img: convert2img
};

export { mdimg as default };
