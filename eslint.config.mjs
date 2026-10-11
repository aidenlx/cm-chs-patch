import obsidianmd from "eslint-plugin-obsidianmd";

// Obsidian policy checks only; oxlint owns general JavaScript/TypeScript linting.
const reviewRules = new Set([
  "no-eval",
  "no-implied-eval",
  "no-unsanitized/method",
  "no-unsanitized/property",
  "no-restricted-globals",
  "@typescript-eslint/no-restricted-imports",
  "@typescript-eslint/no-deprecated",
  "no-alert",
  "@microsoft/sdl/no-document-write",
  "@microsoft/sdl/no-inner-html",
  "depend/ban-dependencies",
]);

export default [
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...obsidianmd.configs.recommended.map((config) => ({
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules ?? {}).map(([name, value]) => [
        name,
        name.startsWith("obsidianmd/") ||
        name.startsWith("eslint-comments/") ||
        reviewRules.has(name)
          ? value
          : "off",
      ]),
    ),
  })),
  {
    rules: {
      // The official action validates metadata and disables sentence-case checks.
      "obsidianmd/validate-manifest": "off",
      "obsidianmd/validate-license": "off",
      "obsidianmd/ui/sentence-case": "off",
      "obsidianmd/ui/sentence-case-json": "off",
      "obsidianmd/ui/sentence-case-locale-module": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
      reportUnusedInlineConfigs: "off",
    },
  },
];
