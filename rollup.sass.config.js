import fs from "fs";
import { createRequire } from "module";
import path from "path";
import scss from "rollup-plugin-scss";

const requirePackage = createRequire(path.resolve(__dirname, "package.json"));

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
          failOnError: true,
          importer(url) {
            if (/^(normalize\.css|github-markdown-css)\//.test(url)) {
              return {
                contents: fs.readFileSync(requirePackage.resolve(url), "utf8"),
              };
            }
            return null;
          },
          output: (styles) => {
            fs.writeFileSync(`${cssPath}/${templateName}.css`, styles);
          },
          outputStyle: "compressed",
        }),
      ],
    };
    tasks.push(task);
  }

  return tasks;
};

export default getSassTasks();
