/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable no-var */
import "obsidian";
declare module "obsidian" {
  interface Vault {
    getConfig(key: string): unknown;
  }
}

declare global {
  declare var CodeMirrorAdapter: any;
  declare var CodeMirror: typeof import("codemirror");
}
