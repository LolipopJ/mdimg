import { convert2img } from '../lib/mdimg.esm.js'

const test = async () => {
  await convert2img({ mdText: '# Hello\nWorld' })
}

test()
