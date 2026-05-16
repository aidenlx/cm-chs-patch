import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  endOfLine: "lf",
  semi: true,
  singleQuote: false,
  jsxSingleQuote: false,
  quoteProps: "as-needed",
  trailingComma: "all",
  arrowParens: "always",
  bracketSpacing: true,
  bracketSameLine: false,
  ignorePatterns: [
    "build/**",
    "dist/**",
    "node_modules/**",
    "packages/**",
    "src/vim.js",
    "src/vim-utils.js",
    "src/chsp-vim.js",
    "pnpm-lock.yaml",
  ],
});
