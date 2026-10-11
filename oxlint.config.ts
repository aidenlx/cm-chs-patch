import { defineConfig } from "oxlint";

export default defineConfig({
  options: { typeAware: true },
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise"],
  rules: {
    "typescript/unbound-method": "error",
    // The segmentation window intentionally reverses strings by code point.
    "typescript/no-misused-spread": ["warn", { allow: ["string"] }],
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
    "pnpm-lock.yaml",
  ],
});
