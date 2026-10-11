export {};

declare global {
  declare const __JIEBA_VERSION__: string;
  declare const __JIEBA_WASM_SHA256__: string;
  declare var CodeMirrorAdapter:
    | { Vim: import("./vim-types").VimApi }
    | undefined;
  declare var CodeMirror: typeof import("codemirror");
}
