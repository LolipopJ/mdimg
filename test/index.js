const { convert2img } = require('../lib/mdimg.js')

const test = async () => {
  const binaryRes = await convert2img({ mdText: '# Hello\nWorld' })
  console.log(`Convert to image successfully!\nFile: ${binaryRes.data}`)

  const base64Res = await convert2img({
    mdText: '# Hello\nWorld',
    encoding: 'base64',
  })
  console.log(`Convert to base64 string successfully!\n${base64Res.data}`)
}

test()
