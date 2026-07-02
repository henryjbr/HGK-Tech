const path = require("node:path");

module.exports = {
  mode: "production",
  entry: {
    script: path.resolve(__dirname, "../src/script.js"),
    dashboard: path.resolve(__dirname, "../src/dashboard.js"),
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "bundle.[name].js",
    clean: false,
  },
};
