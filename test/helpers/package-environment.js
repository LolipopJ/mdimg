/* eslint-disable @typescript-eslint/no-require-imports */

const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");
const jestRequire = createRequire(require.resolve("jest/package.json"));
const { TestEnvironment } = jestRequire("jest-environment-node");

// Keep the tests in Jest's CJS VM and load the product with Node's actual loader.
// This also exercises ESM dependencies on the supported Node 22 runtime.
module.exports = class PackageEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.requirePackage = createRequire;
    this.global.importPackage = (filename) =>
      import(pathToFileURL(filename).href);
  }
};
