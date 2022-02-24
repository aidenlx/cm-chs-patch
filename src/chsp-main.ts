import { Plugin } from "obsidian";

import setupCM5 from "./cm5";
import setupCM6 from "./cm6";
import GoToDownloadModal from "./install-guide";
import { cut, initJieba } from "./jieba";
import { ChsPatchSettingTab, DEFAULT_SETTINGS } from "./settings";

const RANGE_LIMIT = 6;

export default class CMChsPatch extends Plugin {
  libName = "jieba_rs_wasm_bg.wasm";
  get libPath() {
    return this.app.vault.configDir + "/" + this.libName;
  }
  async onload() {
    this.addSettingTab(new ChsPatchSettingTab(this));
    await this.loadSettings();

    if (await this.loadJieba()) {
      setupCM5(this);
      setupCM6(this);
      console.info("editor word splitting patched");
    }
  }

  async loadJieba(): Promise<boolean> {
    const { vault } = this.app;
    if (await vault.adapter.exists(this.libPath, true)) {
      await initJieba(
        this.app.vault.adapter.readBinary(this.libPath),
        this.settings.dict,
      );
      console.info("Jieba loaded");
      return true;
    } else {
      new GoToDownloadModal(this).open();
      return false;
    }
  }

  settings = DEFAULT_SETTINGS;
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  cut(text: string) {
    return cut(text, this.settings.hmm);
  }

  getChsSegFromRange(
    cursor: number,
    range: { from: number; to: number; text: string },
  ) {
    let { from, to, text } = range;
    if (!/[\u4e00-\u9fa5]/.test(text)) {
      return null;
    } else {
      // trim long text
      if (cursor - from > RANGE_LIMIT) {
        const newFrom = cursor - RANGE_LIMIT;
        text = text.slice(newFrom - from);
        from = newFrom;
      }
      if (to - cursor > RANGE_LIMIT) {
        const newTo = cursor + RANGE_LIMIT;
        text = text.slice(0, newTo - to);
        to = newTo;
      }
      const segResult = this.cut(text);
      let chunkStart = 0,
        chunkEnd = 0;
      const relativePos = cursor - from;

      for (const seg of segResult) {
        chunkEnd = chunkStart + seg.length;
        if (relativePos >= chunkStart && relativePos < chunkEnd) {
          break;
        }
        chunkStart += seg.length;
      }
      to = chunkEnd + from;
      from += chunkStart;
      return { from, to };
    }
  }
}
