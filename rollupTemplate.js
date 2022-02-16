import scss from 'rollup-plugin-scss'
const fs = require('fs')
const path = require('path')

export function getScssTasks() {
  const cssPath = 'src/template/css'
  const scssPath = 'src/template/scss'
  const templates = fs
    .readdirSync(path.join(__dirname, scssPath))
    .filter((filename) => {
      return filename.endsWith('.js')
    })

  const tasks = []
  for (const template of templates) {
    const templateName = template.slice(0, -3)
    const task = {
      input: `${scssPath}/${template}`,
      output: {
        format: 'esm',
      },
      plugins: [
        scss({
          output: `${cssPath}/${templateName}.css`,
          sass: require('sass'),
        }),
      ],
    }
    tasks.push(task)
  }

  return tasks
}
