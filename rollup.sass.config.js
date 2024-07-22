import scss from "rollup-plugin-scss";
import fs from "fs";
import path from "path";

const getSassTasks = () => {
  const cssPath = "template/css";
  const scssPath = "template/scss";
  const templates = fs
    .readdirSync(path.join(__dirname, scssPath))
    .filter(
      (filename) => filename.endsWith(".scss") || filename.endsWith(".sass"),
    );

  const tasks = [];
  for (const template of templates) {
    const templateName = template.slice(0, -5);
    const task = {
      input: `${scssPath}/${template}`,
      plugins: [
        scss({
          output: `${cssPath}/${templateName}.css`,
          sass: require("sass"),
        }),
      ],
    };
    tasks.push(task);
  }

  return tasks;
};

export default [...getSassTasks()];
