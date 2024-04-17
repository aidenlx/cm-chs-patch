import { Platform, Plugin } from "obsidian";

import { VimPatcher } from "./chsp-vim.js";
import setupCM6 from "./cm6";
import GoToDownloadModal from "./install-guide";
import { cut, initJieba } from "./jieba";
import { ChsPatchSettingTab, DEFAULT_SETTINGS } from "./settings";
import { chsPatternGlobal, isChs } from "./utils.js";

const CHS_RANGE_LIMIT = 10;

const userDataDir = Platform.isDesktopApp
  ? // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@electron/remote").app.getPath("userData")
  : null;

export default class CMChsPatch extends Plugin {
  libName = "jieba_rs_wasm_bg.wasm";
  async loadLib(): Promise<ArrayBuffer | null> {
    if (userDataDir) {
      const { readFile } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
        require("fs/promises") as typeof import("fs/promises");
      // read file to arraybuffer in nodejs
      try {
        const buf = await readFile(this.libPath);
        return buf;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
          return null;
        }
        throw e;
      }
    } else {
      if (!(await app.vault.adapter.exists(this.libPath, true))) {
        return null;
      }
      const buf = await app.vault.adapter.readBinary(this.libPath);
      return buf;
    }
  }
  async libExists(): Promise<boolean> {
    if (userDataDir) {
      const { access } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
        require("fs/promises") as typeof import("fs/promises");
      try {
        await access(this.libPath);
        return true;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
          return false;
        }
        throw e;
      }
    } else {
      return await app.vault.adapter.exists(this.libPath, true);
    }
  }
  async saveLib(ab: ArrayBuffer): Promise<void> {
    if (userDataDir) {
      const { writeFile } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
        require("fs/promises") as typeof import("fs/promises");
      await writeFile(this.libPath, Buffer.from(ab));
    } else {
      await app.vault.adapter.writeBinary(this.libPath, ab);
    }
  }
  get libPath(): string {
    if (userDataDir) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
      const { join } = require("path") as typeof import("path");
      return join(userDataDir, this.libName);
    } else {
      return [app.vault.configDir, this.libName].join("/");
    }
  }

  async onload() {
    this.addSettingTab(new ChsPatchSettingTab(this));

    await this.loadSettings();

    if (await this.loadSegmenter()) {
      setupCM6(this);
      console.info("editor word splitting patched");
    }
    this.addChild(new VimPatcher(this));
  }

  settings = DEFAULT_SETTINGS;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  segmenter?: Intl.Segmenter;

  async loadSegmenter(): Promise<boolean> {
    if (!this.settings.useJieba && window.Intl?.Segmenter) {
      this.segmenter = new Intl.Segmenter("zh-CN", {
        granularity: "word",
      });
      console.info("window.Intl.Segmenter loaded");
      return true;
    }

    const jiebaBinary = await this.loadLib();
    if (!jiebaBinary) {
      new GoToDownloadModal(this).open();
      return false;
    }
    await initJieba(jiebaBinary, this.settings.dict);
    console.info("Jieba loaded");
    return true;
  }

  cut(text: string): string[] {
    if (!this.settings.useJieba && this.segmenter) {
      return Array.from(this.segmenter.segment(text)).map((seg) => seg.segment);
    } else return cut(text, this.settings.hmm);
  }

  getSegRangeFromCursor(
    cursor: number,
    { from, to, text }: { from: number; to: number; text: string },
  ) {
    if (!isChs(text)) {
      // 匹配中文字符
      return null;
    } else {
      // trim long text
      if (cursor - from > CHS_RANGE_LIMIT) {
        const newFrom = cursor - CHS_RANGE_LIMIT;
        if (isChs(text.slice(newFrom, cursor))) {
          // 英文单词超过 RANGE_LIMIT 被截断，不执行截断优化策略
          text = text.slice(newFrom - from);
          from = newFrom;
        }
      }
      if (to - cursor > CHS_RANGE_LIMIT) {
        const newTo = cursor + CHS_RANGE_LIMIT;
        if (isChs(text.slice(cursor, newTo))) {
          // 英文单词超过 RANGE_LIMIT 被截断，不执行截断优化策略
          text = text.slice(0, newTo - to);
          to = newTo;
        }
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

  getSegDestFromGroup(
    startPos: number,
    nextPos: number,
    sliceDoc: (from: number, to: number) => string,
  ): number | null {
    const forward = startPos < nextPos;
    const text = limitChsChars(
      forward ? sliceDoc(startPos, nextPos) : sliceDoc(nextPos, startPos),
      forward,
    );
    const segResult = this.cut(text);
    if (segResult.length === 0) return null;

    let length = 0;
    let seg: string;
    do {
      seg = forward ? segResult.shift()! : segResult.pop()!;
      length += seg.length;
    } while (/\s+/.test(seg));

    return forward ? startPos + length : startPos - length;
  }
}

function limitChsChars(input: string, forward: boolean) {
  if (!forward) {
    input = [...input].reverse().join("");
  }
  let endingIndex = input.length - 1;
  let chsCount = 0;
  for (const { index } of input.matchAll(chsPatternGlobal)) {
    chsCount++;
    endingIndex = index;
    if (chsCount > CHS_RANGE_LIMIT) break;
  }
  const output = input.slice(0, endingIndex + 1);
  if (!forward) {
    return [...output].reverse().join("");
  }
  return output;
}
