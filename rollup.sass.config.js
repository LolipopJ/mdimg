import fs from "fs";
import path from "path";
import scss from "rollup-plugin-scss";

const getSassTasks = () => {
  const cssPath = path.resolve(__dirname, "template/css");
  const scssPath = path.resolve(__dirname, "template/scss");
  const templates = fs
    .readdirSync(scssPath)
    .filter(
      (filename) =>
        (filename.endsWith(".scss") || filename.endsWith(".sass")) &&
        !filename.startsWith("."),
    );

  const tasks = [];
  for (const template of templates) {
    const templateName = template.slice(0, -5);
    const task = {
      input: `${scssPath}/${templateName}.scss`,
      plugins: [
        scss({
          output: (styles) => {
            fs.writeFileSync(`${cssPath}/${templateName}.css`, styles);
          },
        }),
      ],
    };
    tasks.push(task);
  }

  return tasks;
};

export default getSassTasks();
