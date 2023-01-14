import { Plugin } from "obsidian";

import { VimPatcher } from "./chsp-vim";
import setupCM5 from "./cm5";
import setupCM6 from "./cm6";
import GoToDownloadModal from "./install-guide";
import { cut, initJieba } from "./jieba";
import { ChsPatchSettingTab, DEFAULT_SETTINGS } from "./settings";

const RANGE_LIMIT = 6;

export default class CMChsPatch extends Plugin {
  libName = "jieba_rs_wasm_bg.wasm";

  private patcher: any;

  get libPath() {
    return this.app.vault.configDir + "/" + this.libName;
  }

  async onload() {
    this.addSettingTab(new ChsPatchSettingTab(this));

    await this.loadSettings();

    if (await this.loadSegmenter()) {
      setupCM5(this);
      setupCM6(this);
      console.info("editor word splitting patched");
    }

    this.patcher = VimPatcher(this);
    this.patcher.initialize();
  }

  settings = DEFAULT_SETTINGS;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    this.patcher.initialize();
    await this.saveData(this.settings);
  }

  segmenter: any;

  async loadSegmenter(): Promise<boolean> {
    const { vault } = this.app;

    if (!this.settings.useJieba && (window.Intl as any)?.Segmenter) {
      this.segmenter = new (Intl as any).Segmenter("zh-CN", {
        granularity: "word",
      });
      console.info("window.Intl.Segmenter loaded");
      return true;
    }

    if (await vault.adapter.exists(this.libPath, true)) {
      await initJieba(
        vault.adapter.readBinary(this.libPath),
        this.settings.dict,
      );
      console.info("Jieba loaded");
      return true;
    } else {
      new GoToDownloadModal(this).open();
      return false;
    }
  }

  cut(text: string): string[] {
    if (!this.settings.useJieba && this.segmenter) {
      return Array.from(this.segmenter.segment(text)).map(
        (seg) => (seg as any).segment,
      );
    } else return cut(text, this.settings.hmm);
  }

  getSegRangeFromCursor(
    cursor: number,
    { from, to, text }: { from: number; to: number; text: string },
  ) {
    if (!/[\u4e00-\u9fff]/.test(text)) {
      // 匹配中文字符
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

      if (cursor === to) {
        const lastSeg = segResult.last()!;
        return { from: to - lastSeg.length, to };
      }

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

  getSegRangeFromGroup(
    startPos: number,
    nextPos: number,
    sliceDoc: (from: number, to: number) => string,
  ): number | null {
    const oldNextPos = nextPos;
    const forward = startPos < nextPos;
    if (Math.abs(startPos - nextPos) > RANGE_LIMIT) {
      nextPos = startPos + RANGE_LIMIT * (forward ? 1 : -1);
    }

    let text = forward
      ? sliceDoc(startPos, nextPos)
      : sliceDoc(nextPos, startPos);

    if (!/[\u4e00-\u9fff]/.test(text)) {
      if (oldNextPos == nextPos) {
        return null;
      } else {
        // 英文单词超过 RANGE_LIMIT 被截断，不执行截断优化策略
        nextPos = oldNextPos;
        text = forward
          ? sliceDoc(startPos, nextPos)
          : sliceDoc(nextPos, startPos);
      }
    }

    const segResult = this.cut(text);
    if (segResult.length === 0) return null;
    return forward
      ? startPos + segResult.first()!.length
      : startPos - segResult.last()!.length;
  }
}
