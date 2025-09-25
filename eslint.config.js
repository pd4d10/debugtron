// @ts-check
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import stylistic from "@stylistic/eslint-plugin";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      react,
      "react-hooks": reactHooks,
      "@stylistic": stylistic,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...ts.configs["strict-type-checked"]?.rules,
      ...ts.configs["stylistic-type-checked"]?.rules,

      // TODO: re-enable these rules
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-require-imports": "off",

      // Disable conflicting base ESLint rules
      "no-unused-vars": "off",
      "no-undef": "off",

      // React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/jsx-uses-react": "off", // Not needed in React 17+
      "react/jsx-uses-vars": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-key": "error",
      "react/no-unused-state": "error",
      "react/no-direct-mutation-state": "error",
      "react/prefer-stateless-function": "error",
      "react/jsx-curly-brace-presence": ["error", {
        props: "never",
        children: "never",
      }],

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",

      // Code organization rules (built-in ESLint)
      "no-duplicate-imports": "error",

      // ESLint Stylistic formatting rules
      "@stylistic/indent": ["error", 2],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/space-before-function-paren": ["error", {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      }],
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "@stylistic/keyword-spacing": "error",
      "@stylistic/space-infix-ops": "error",
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/eol-last": "error",
      "@stylistic/max-len": ["error", {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      }],
      "@stylistic/multiline-ternary": ["error", "always-multiline"],
      "@stylistic/operator-linebreak": ["error", "before"],
      "@stylistic/member-delimiter-style": ["error", {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
      }],
      "@stylistic/type-annotation-spacing": "error",
      "@stylistic/jsx-quotes": ["error", "prefer-double"],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/jsx-closing-bracket-location": ["error", "line-aligned"],
      "@stylistic/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
      "@stylistic/jsx-first-prop-new-line": ["error", "multiline-multiprop"],

      // Electron-specific exceptions
      "@typescript-eslint/no-var-requires": "off", // Allow require() in Electron main process

      // Project-specific adjustments for Electron/React app
      "@typescript-eslint/no-unsafe-member-access": "off", // Electron IPC and external APIs
      "@typescript-eslint/no-unsafe-assignment": "off", // Electron IPC and external APIs
      "@typescript-eslint/no-unsafe-call": "off", // Electron IPC and external APIs
      "@typescript-eslint/no-unsafe-return": "off", // Electron IPC and external APIs
      "@typescript-eslint/no-unsafe-argument": "off", // Electron IPC and external APIs
      "@typescript-eslint/restrict-template-expressions": "off", // Allow flexible template expressions
      "@typescript-eslint/prefer-nullish-coalescing": ["error", {
        ignoreConditionalTests: true,
        ignoreTernaryTests: true,
      }],
    },
  },
  {
    // Configuration files - less strict rules
    files: ["*.config.{js,mjs,ts}", "forge.config.js", "vite.*.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
