// This file defines the Babel compilation presets used during testing operations.
// It translates ES module import and export syntax to CommonJS for Jest execution.

module.exports = {
  presets: [
    // Configure Babel env settings matching the current executing Node environment
    ["@babel/preset-env", { targets: { node: "current" } }]
  ]
};
