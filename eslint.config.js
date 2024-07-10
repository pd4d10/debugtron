const { defineFlatConfig } = require("eslint-define-config");
const ts = require("@typescript-eslint/eslint-plugin");
const parser = require("@typescript-eslint/parser");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineFlatConfig({
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": ts,
    react,
    "react-hooks": reactHooks,
  },
  rules: {
    ...ts.configs.recommended.rules,
    "@typescript-eslint/no-var-requires": "off", // electron require

    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
    ...reactHooks.configs.recommended.rules,
  },
});
