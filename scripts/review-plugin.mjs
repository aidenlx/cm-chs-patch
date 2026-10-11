import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

// Keep local review and CI on the same official workflow revision.
const revision = "8167caed39664214d82c86fdfa32e06d8d55f61d";
const directory = resolve(".scratch/obsidian-review");
await mkdir(directory, { recursive: true });
const response = await fetch(
  `https://raw.githubusercontent.com/obsidianmd/obsidian-workflows/${revision}/dist/index.js`,
);
if (!response.ok)
  throw new Error(`Cannot download reviewer: ${response.status}`);
const entry = resolve(directory, "index.mjs");
await writeFile(entry, await response.text());
const summary = resolve(directory, "summary.md");
await writeFile(summary, "");
const child = spawn(process.execPath, [entry], {
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_cache: resolve(directory, "npm-cache"),
    GITHUB_WORKSPACE: process.cwd(),
    GITHUB_REPOSITORY: "AidenLx/cm-chs-patch",
    GITHUB_STEP_SUMMARY: summary,
    INPUT_TYPE: "plugin",
    INPUT_MODE: "pr",
    INPUT_BUILD: "npm run build",
    INPUT_LINT: "true",
    "INPUT_SCANNER-LINT": "true",
    INPUT_STRICT: "false",
  },
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
