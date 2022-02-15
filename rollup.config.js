import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import license from 'rollup-plugin-license'

module.exports = [
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.umd.js',
      format: 'umd',
    },
    plugins: [
      license({
        banner: `
mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg
`,
      }),
      commonjs(),
      babel({
        presets: [['@babel/preset-env', { loose: true }]],
      }),
    ],
  },
  {
    input: 'src/mdimg.js',
    output: {
      file: 'lib/mdimg.cjs',
      format: 'cjs',
    },
    plugins: [
      license({
        banner: `
mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg
`,
      }),
      commonjs(),
      babel({
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
        banner: `
mdimg - convert markdown to image
Copyright (c) 2022-${new Date().getFullYear()}, LolipopJ. (MIT Licensed)
https://github.com/LolipopJ/mdimg
`,
      }),
      commonjs(),
    ],
  },
]
