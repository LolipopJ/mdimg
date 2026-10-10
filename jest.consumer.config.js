/* eslint-disable @typescript-eslint/no-require-imports */

module.exports = {
  ...require("./jest.config"),
  testMatch: ["<rootDir>/test/consumer.test.js"],
  testPathIgnorePatterns: [],
};
