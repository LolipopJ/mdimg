import scss from 'rollup-plugin-scss'
const fs = require('fs')
const path = require('path')

export function getScssTasks() {
  const cssPath = 'src/template/css'
  const scssPath = 'src/template/scss'
  const templates = fs
    .readdirSync(path.join(__dirname, scssPath))
    .filter((filename) => {
      return filename.endsWith('.scss') || filename.endsWith('.sass')
    })

  const tasks = []
  for (const template of templates) {
    const templateName = template.slice(0, -5)
    const task = {
      input: `${scssPath}/${template}`,
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
