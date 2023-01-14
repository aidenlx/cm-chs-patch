/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable no-var */
import "obsidian";
declare module "obsidian" {
  interface App {
    plugins: {
      enablePlugin(id: string): Promise<void>;
      disablePlugin(id: string): Promise<void>;
    };
    setting: {
      openTabById(id: string): any;
    };
  }
  interface Vault {
    getConfig(key: string): unknown;
  }
}

declare global {
  declare var CodeMirrorAdapter: any;
  declare var CodeMirror: typeof import("codemirror");
}
