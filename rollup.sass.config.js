import scss from 'rollup-plugin-scss'
const fs = require('fs')
const path = require('path')

function getSassTasks() {
  const cssPath = 'template/css'
  const scssPath = 'template/scss'
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

module.exports = [...getSassTasks()]
