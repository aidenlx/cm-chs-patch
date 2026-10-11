import { Notice, Plugin } from "obsidian";
import { VimPatcher } from "./chsp-vim.js";
import setupCM6 from "./cm6";
import GoToDownloadModal from "./install-guide";
import { cut, cutForSearch, initJieba } from "./jieba";
import { ChsPatchSettingTab, DEFAULT_SETTINGS } from "./settings";
import { chsPatternGlobal, isChs } from "./utils.js";
import { loadWasm, saveWasm } from "./wasm-cache";

const CHS_RANGE_LIMIT = 10;
export default class CMChsPatch extends Plugin {
  libName = `jieba_rs_wasm_${__JIEBA_VERSION__.replaceAll(".", "_")}.wasm`;
  loadLib = loadWasm;
  saveLib = saveWasm;
  private patchesInstalled = false;
  private active = false;
  private settingTab?: ChsPatchSettingTab;

  async libExists(): Promise<boolean> {
    return (await this.loadLib()) !== null;
  }

  async onload() {
    this.active = true;
    await this.loadSettings();
    this.settingTab = new ChsPatchSettingTab(this);
    this.addSettingTab(this.settingTab);

    try {
      await this.applySegmenter();
    } catch (error) {
      console.error("Failed to load word splitting engine", error);
      new Notice("分词引擎加载失败，请在设置中重新导入结巴分词组件");
    }
  }

  onunload() {
    this.active = false;
  }

  private enablePatches() {
    if (!this.active || this.patchesInstalled) return;
    setupCM6(this);
    this.addChild(new VimPatcher(this));
    this.patchesInstalled = true;
  }

  async applySegmenter() {
    if (await this.loadSegmenter()) this.enablePatches();
  }

  async installJieba(binary: ArrayBuffer) {
    await this.saveLib(binary);
    await initJieba(binary, this.settings.dict);
    this.settings.useJieba = true;
    this.segmenter = undefined;
    this.enablePatches();
    await this.saveData(this.settings);
    if (this.active) this.settingTab?.update();
  }

  settings = DEFAULT_SETTINGS;

  async loadSettings() {
    const data: unknown = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS };
    if (typeof data === "object" && data !== null) {
      for (const key of Object.keys(
        DEFAULT_SETTINGS,
      ) as (keyof typeof DEFAULT_SETTINGS)[]) {
        const value: unknown = Reflect.get(data, key);
        if (key === "dict" && typeof value === "string")
          this.settings.dict = value;
        else if (key !== "dict" && typeof value === "boolean")
          this.settings[key] = value;
      }
    }
  }

  segmenter?: Intl.Segmenter;

  async loadSegmenter(): Promise<boolean> {
    if (!this.settings.useJieba && window.Intl?.Segmenter) {
      this.segmenter = new Intl.Segmenter("zh-CN", {
        granularity: "word",
      });
      return true;
    }

    const jiebaBinary = await this.loadLib();
    if (!jiebaBinary) {
      new GoToDownloadModal(this).open();
      return false;
    }
    await initJieba(jiebaBinary, this.settings.dict);
    if (this.settings.useJieba || !window.Intl?.Segmenter) {
      this.segmenter = undefined;
    }
    return true;
  }

  cut(text: string, { search = false }: { search?: boolean } = {}): string[] {
    if (this.segmenter) {
      return Array.from(this.segmenter.segment(text)).map((seg) => seg.segment);
    }
    if (search) {
      return cutForSearch(text, this.settings.hmm);
    }
    return cut(text, this.settings.hmm);
  }

  getSegRangeFromCursor(
    cursor: number,
    range: { from: number; to: number; text: string },
  ) {
    let { from, to, text } = range;
    if (!isChs(text)) {
      // 匹配中文字符
      return null;
    } else {
      // trim long text
      if (cursor - from > CHS_RANGE_LIMIT) {
        const newFrom = cursor - CHS_RANGE_LIMIT;
        if (isChs(text.slice(newFrom - from, cursor - from))) {
          // 英文单词超过 RANGE_LIMIT 被截断，不执行截断优化策略
          text = text.slice(newFrom - from);
          from = newFrom;
        }
      }
      if (to - cursor > CHS_RANGE_LIMIT) {
        const newTo = cursor + CHS_RANGE_LIMIT;
        if (isChs(text.slice(cursor - from, newTo - from))) {
          // 英文单词超过 RANGE_LIMIT 被截断，不执行截断优化策略
          text = text.slice(0, newTo - from);
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
    if (!isChs(text)) return null;
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
  const s = forward ? input : [...input].reverse().join("");
  let endingIndex = s.length - 1;
  let chsCount = 0;
  for (const { index } of s.matchAll(chsPatternGlobal)) {
    chsCount++;
    endingIndex = index;
    if (chsCount > CHS_RANGE_LIMIT) break;
  }
  const output = s.slice(0, endingIndex + 1);
  if (!forward) {
    return [...output].reverse().join("");
  }
  return output;
}
