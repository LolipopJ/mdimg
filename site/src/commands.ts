import type { IConvertOptions } from "../../src/interfaces/index";
import type { Config } from "./config";

export type Shell = "posix" | "powershell";

export function quoteShell(value: string, shell: Shell): string {
  return `'${value.replace(/'/g, shell === "powershell" ? "''" : "'\\''")}'`;
}

export function createCalls(
  config: Config,
  htmlTemplate: string,
  shell: Shell,
) {
  const options: IConvertOptions = {
    inputFilename: "path/to/file.md",
    outputFilename: `path/to/image.${config.type}`,
    type: config.type,
    width: config.width,
    htmlTemplate,
    cssTemplate: config.cssTemplate,
    extensions: {
      highlightJs: config.highlightJs
        ? { theme: config.highlightTheme }
        : false,
      mathJax: config.mathJax
        ? {
            tex: {
              inlineMath: [
                ["$", "$"],
                ["\\(", "\\)"],
              ],
            },
          }
        : false,
      mermaid: config.mermaid ? { theme: config.mermaidTheme } : false,
    },
    ...(config.type === "png" ? {} : { quality: config.quality }),
  };
  const q = (value: string) => quoteShell(value, shell);
  const cli = `mdimg -i ${q(options.inputFilename!)} -o ${q(options.outputFilename!)} --type ${config.type} --width ${config.width} --html ${q(htmlTemplate)} --css ${q(config.cssTemplate)}${config.type === "png" ? "" : ` --quality ${config.quality}`} --extensions ${q(JSON.stringify(options.extensions))}`;
  return {
    options,
    cli,
    node: `import { mdimg } from "mdimg";\n\nawait mdimg(${JSON.stringify(options, null, 2)});`,
  };
}
