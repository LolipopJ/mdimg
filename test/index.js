const { convert2img } = require('../lib/mdimg.js')
const { resolve } = require('path')

const test = async () => {
  const sourceTest = resolve(__dirname, 'test.md')
  const sourceTestTemplateWords = resolve(__dirname, 'testTemplateWords.md')
  const outputFilenameBase = resolve(__dirname, '../docs')

  console.log('Convert to image with empty CSS template...')
  await convert2img({
    mdFile: sourceTest,
    outputFilename: `${outputFilenameBase}/empty.png`,
    cssTemplate: 'empty',
    log: true,
  })

  console.log('Convert to image with default template...')
  await convert2img({
    mdFile: sourceTest,
    outputFilename: `${outputFilenameBase}/default.png`,
    log: true,
  })

  // console.log('Convert to base64 string with default template...')
  // await convert2img({
  //   mdFile: sourceTest,
  //   encoding: 'base64',
  //   log: true,
  // })

  console.log('Convert to image with github CSS template...')
  await convert2img({
    mdFile: sourceTest,
    outputFilename: `${outputFilenameBase}/github.png`,
    cssTemplate: 'github',
    width: 1000,
    log: true,
  })
  await convert2img({
    mdFile: sourceTest,
    outputFilename: `${outputFilenameBase}/githubDark.png`,
    cssTemplate: 'githubDark',
    width: 1000,
    log: true,
  })

  console.log('Convert to image with words template...')
  await convert2img({
    mdFile: sourceTestTemplateWords,
    outputFilename: `${outputFilenameBase}/words.png`,
    htmlTemplate: 'words',
    cssTemplate: 'words',
    width: 1200,
    log: true,
  })
}

test()
