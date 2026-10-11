import "obsidian";
declare module "obsidian" {
  interface Vault {
    getConfig(key: string): unknown;
  }
}

declare global {
  declare const __JIEBA_VERSION__: string;
  declare var CodeMirrorAdapter:
    | { Vim: import("./vim-types").VimApi }
    | undefined;
  declare var CodeMirror: typeof import("codemirror");
}
