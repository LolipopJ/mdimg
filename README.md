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

### In Node.js project

## Inspired by

- [md2img](https://github.com/363797271/md2img). Provided me the idea and a complete feasible solution.
