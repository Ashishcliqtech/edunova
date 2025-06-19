// .eslintrc.js
module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script",
  },
  rules: {
    "no-undef": "error",         // ✅ This catches missing imports
    "no-unused-vars": "warn",    // Optional
    "no-console": "off"          // Optional
  }
};
