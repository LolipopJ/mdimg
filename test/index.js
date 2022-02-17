const { convert2img } = require('../lib/mdimg.js')

const test = async () => {
  await convert2img({ mdText: '# Hello\nWorld', log: true })

  await convert2img({
    mdText: '# Hello\nWorld',
    encoding: 'base64',
    log: true,
  })
}

test()
