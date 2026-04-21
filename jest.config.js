module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./.babelrc.jest" }],
  },
  transformIgnorePatterns: [],
};
