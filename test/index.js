const { convert2img } = require('../lib/mdimg.js')
const { resolve } = require('path')

const test = async () => {
  const source = resolve(__dirname, '../README.md')

  console.log('Convert to image with default template...')
  await convert2img({ mdFile: source, log: true })

  console.log('Convert to base64 string with default template...')
  await convert2img({
    mdFile: source,
    encoding: 'base64',
    log: true,
  })

  console.log('Convert to image with github CSS template...')
  await convert2img({
    mdFile: source,
    cssTemplate: 'github',
    width: 1000,
    log: true,
  })
  await convert2img({
    mdFile: source,
    cssTemplate: 'githubDark',
    width: 1000,
    log: true,
  })
}

test()
