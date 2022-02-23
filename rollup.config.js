import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import license from 'rollup-plugin-license'

const licenseBanner = `
mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg
`

const externalModules = ['cheerio', 'marked', 'puppeteer']
const pluginsArray = [
  license({
    banner: licenseBanner,
  }),
  nodeResolve({ preferBuiltins: true }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
  }),
]

module.exports = [
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.js',
      format: 'cjs',
      exports: 'auto',
    },
    external: externalModules,
    plugins: pluginsArray,
  },
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.mjs',
      format: 'esm',
    },
    external: externalModules,
    plugins: pluginsArray,
  },
]
