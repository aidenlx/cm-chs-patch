import { Platform } from "obsidian";
import type { App } from "obsidian";

const legacyFilename = /^jieba_rs_wasm_(?:bg|\d+_\d+_\d+)\.wasm$/;

export interface LegacyCacheFile {
  name: string;
  location: string;
  remove(): Promise<void>;
}

// Only used for explicit legacy cleanup. New installations use IndexedDB.
export async function listLegacyCaches(app: App): Promise<LegacyCacheFile[]> {
  const files: LegacyCacheFile[] = [];
  const adapter = app.vault.adapter;
  const vaultFiles = await adapter.list(app.vault.configDir);
  for (const path of vaultFiles.files) {
    const name = path.slice(path.lastIndexOf("/") + 1);
    if (!legacyFilename.test(name)) continue;
    files.push({ name, location: path, remove: () => adapter.remove(path) });
  }

  if (Platform.isDesktop) {
    const { app: electronApp } =
      require("@electron/remote") as typeof import("@electron/remote");
    const fs = require("node:fs/promises") as typeof import("node:fs/promises");
    const { join } = require("node:path") as typeof import("node:path");
    const directory = electronApp.getPath("userData");
    for (const name of await fs.readdir(directory)) {
      if (!legacyFilename.test(name)) continue;
      const path = join(directory, name);
      // Do not follow directories or symlinks matching an old cache filename.
      if (!(await fs.lstat(path)).isFile()) continue;
      files.push({ name, location: path, remove: () => fs.unlink(path) });
    }
  }
  return files;
}
