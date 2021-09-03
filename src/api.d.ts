import "obsidian";

import pinyinlite from "pinyinlite";
export interface ChsPatchAPI {
  pinyin: typeof pinyinlite;
  chsRegex: RegExp;
}

declare module "obsidian" {
  interface App {
    plugins: {
      enabledPlugins: Set<string>;
    };
  }
  interface MetadataCache {
    on(...args: OnArgs<Evt_ApiReady>): EventRef;
  }
}

export type Evt_ApiReady = [name: "chs-patch:ready", api: ChsPatchAPI];
type OnArgs<T> = T extends [infer A, ...infer B]
  ? A extends string
    ? [name: A, callback: (...args: B) => any]
    : never
  : never;

declare global {
  // Must use var, no const/let
  var ChsPatchAPI: ChsPatchAPI | undefined;
}
export type API_NAME = "ChsPatchAPI";
export type PLUGIN_ID = "cm-chs-patch";
