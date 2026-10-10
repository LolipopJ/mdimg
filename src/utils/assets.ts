import fs from "fs";
import path from "path";

const assetRoot = path.resolve(__dirname, "assets");

export const readAsset = (name: string): string => {
  const filename = path.resolve(assetRoot, name);
  if (!filename.startsWith(`${assetRoot}${path.sep}`)) {
    throw new Error(`mdimg: invalid asset path ${name}`);
  }
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (error) {
    throw new Error(`mdimg: missing or unreadable asset ${name}`, {
      cause: error,
    });
  }
};

export const readAssetTable = (prefixes: string[]): Record<string, string> => {
  const manifest = JSON.parse(readAsset("manifest.json")) as {
    files: { path: string }[];
  };
  const resources: Record<string, string> = {};
  for (const { path: name } of manifest.files) {
    if (
      name.endsWith(".js") &&
      prefixes.some((prefix) => name.startsWith(prefix))
    ) {
      resources[name] =
        `data:text/javascript;base64,${Buffer.from(readAsset(name)).toString("base64")}`;
    }
  }
  return resources;
};

export const serializeForScript = (value: unknown): string =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

export const inlineScript = (source: string): string =>
  `<script>${source.replace(/<\/script/gi, "<\\/script")}</script>`;
