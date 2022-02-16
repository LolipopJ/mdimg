import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import license from 'rollup-plugin-license'

import { getScssTasks } from './rollupTemplate'

const licenseBanner = `
mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg
`

module.exports = [
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.cjs',
      format: 'cjs',
    },
    plugins: [
      license({
        banner: licenseBanner,
      }),
      nodeResolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        presets: [['@babel/preset-env', { loose: true }]],
      }),
    ],
  },
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.esm.js',
      format: 'esm',
    },
    plugins: [
      license({
        banner: licenseBanner,
      }),
      nodeResolve(),
      commonjs(),
    ],
  },
  ...getScssTasks(),
]
