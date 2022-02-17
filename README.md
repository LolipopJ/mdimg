# mdimg

A tool that can be used to convert Markdown or HTML format text to an image.

## How does it work?

First, the script calls [marked](https://github.com/markedjs/marked) to parse Markdown text into an HTML document. Next, use [Puppeteer](https://github.com/puppeteer/puppeteer) to start a headless browser to render the HTML with preset CSS file. Finally, export our image through Puppeteer's [screenshot](https://pptr.dev/#?product=Puppeteer&show=api-pagescreenshotoptions) API.

## Installation

CLI:

```bash
npm install -g mdimg
```

In Node.js project:

```bash
npm install mdimg
```

## Usage

### CLI

Example:

```bash
mdimg -i input.md -o output.png -w 600
```

mdimg will read text from `input.md` and convert it to an image file `output.png`.

### In Node.js project

Import mdimg to your project:

```js
const { convert2img } = require('mdimg')

// or use import
import { convert2img } from 'mdimg'
```

Convert markdown text or file to image:

```js
const convertRes = await convert2img({
  mdFile: 'path/to/input.md',
  outputFileName: 'path/to/output.png',
  width: 600,
})

console.log(`Convert to image successfully!\nFile: ${convertRes.data}`)
```

Options:

| Argument       | Type      | Default                         | Notes                                                                                                                                                                                              |
| -------------- | --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mdText         | `String`  | `null`                          | Input Markdown or HTML text directly. This option **has no effect** if `mdFile` is specified                                                                                                       |
| mdFile         | `String`  | `null`                          | Read from a file instead of typing directly                                                                                                                                                        |
| htmlTemplate   | `String`  | `default`                       | HTML template. Available template names can be found in `src/template/html`                                                                                                                        |
| cssTemplate    | `String`  | `default`                       | CSS template. Available template names can be found in `src/template/css`                                                                                                                          |
| width          | `Number`  | `800`                           | The width of output image                                                                                                                                                                          |
| encoding       | `String`  | `binary`                        | The encoding of output image. Available value can be `binary` or `base64`. If `binary`, return data will be the image's path. If `base64`, return data will be the image's base64 encoding string. |
| outputFileName | `String`  | `mdimg_output/mdimg_${now}.png` | Output binary image file storage address. File type can be `jpeg`, `png` or `webp`, defaults to `png`. Available when `encoding` option is `binary`                                                |
| log            | `Boolean` | `false`                         | Show preset console log                                                                                                                                                                            |

## Inspired by

- [md2img](https://github.com/363797271/md2img). Provided me the idea and a complete feasible solution.
- [marked](https://github.com/markedjs/marked). Learned a possible method to write a JavaScript library.
