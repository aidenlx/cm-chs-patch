import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise"],
  rules: {
    "typescript/no-non-null-assertion": "off",
    "typescript/no-explicit-any": "off",
    "typescript/ban-ts-comment": "off",
    "no-param-reassign": "warn",
    "prefer-template": "warn",
  },
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
