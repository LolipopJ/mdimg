const { convert2img } = require('../lib/mdimg.js')
const { resolve } = require('path')

const sourceTest = resolve(__dirname, 'test.md')
const sourceTestTemplateWords = resolve(__dirname, 'testTemplateWords.md')
const outputFilenameBase = resolve(__dirname, '../docs')

test('Convert to image with Empty CSS template', async () => {
  const outputFilename = resolve(`${outputFilenameBase}/empty.png`)
  const convertRes = await convert2img({
    mdFile: sourceTest,
    outputFilename,
    cssTemplate: 'empty',
    log: true,
  })
  expect(convertRes.path).toBe(outputFilename)
})

test('Convert to image with Default template', async () => {
  const outputFilename = resolve(`${outputFilenameBase}/default.png`)
  const convertRes = await convert2img({
    mdFile: sourceTest,
    outputFilename,
    log: true,
  })
  expect(convertRes.path).toBe(outputFilename)
})

test('Convert to image with Github CSS template', async () => {
  const outputFilename = resolve(`${outputFilenameBase}/github.png`)
  const convertRes = await convert2img({
    mdFile: sourceTest,
    outputFilename,
    cssTemplate: 'github',
    width: 1000,
    log: true,
  })
  expect(convertRes.path).toBe(outputFilename)
})

test('Convert to image with Github Dark CSS template', async () => {
  const outputFilename = resolve(`${outputFilenameBase}/githubDark.png`)
  const convertRes = await convert2img({
    mdFile: sourceTest,
    outputFilename,
    cssTemplate: 'githubDark',
    width: 1000,
    log: true,
  })
  expect(convertRes.path).toBe(outputFilename)
})

test('Convert to image with Words template', async () => {
  const outputFilename = resolve(`${outputFilenameBase}/words.png`)
  const convertRes = await convert2img({
    mdFile: sourceTestTemplateWords,
    outputFilename,
    htmlTemplate: 'words',
    cssTemplate: 'words',
    width: 1200,
    log: true,
  })
  expect(convertRes.path).toBe(outputFilename)
})
