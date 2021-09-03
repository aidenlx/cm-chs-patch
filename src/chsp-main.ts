import { around } from "monkey-around";
import { Plugin } from "obsidian";
import pinyin from "pinyinlite";
import { Segment, useDefault } from "segmentit";

import { API_NAME, ChsPatchAPI, Evt_ApiReady } from "./api";
import { Range } from "./selection";

const API_NAME: API_NAME extends keyof typeof window ? API_NAME : never =
  "ChsPatchAPI" as const; // this line will throw error when name out of sync

export default class CMChsPatch extends Plugin {
  api?: ChsPatchAPI;

  segmentit?: any;

  async onload() {
    console.log("loading cm-chs-patch");
    this.loadSegmentit();
  }

  loadApi() {
    const api = { pinyin };
    this.api = api;
    window[API_NAME] = api;
    this.register(() => (window[API_NAME] = undefined));
    console.log("ChsPatch API ready");

    this.app.metadataCache.trigger(...(<Evt_ApiReady>["chs-patch:ready", api]));
  }

  loadSegmentit() {
    const segmentit = useDefault(new Segment());
    this.segmentit = segmentit;
    this.registerCodeMirror((cm) => {
      const unload = around(cm, {
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
        findWordAt(next) {
          // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
          return function (pos: CodeMirror.Position): CodeMirror.Range {
            const { Pos } = CodeMirror,
              range = 6; // Used to control trim range

            const result = next.call(cm, pos);

            let line = cm.getLine(pos.line);
            let start = result.from().ch;
            let end = result.to().ch;

            // Pass result out directly if no chs present
            if (!/[\u4e00-\u9fa5]/.test(line.substring(start, end))) {
              return result;
            } else {
              // trim long text
              if (pos.ch - start > range) {
                start = pos.ch - range;
              }
              if (end - pos.ch > range) {
                end = pos.ch + range;
              }
              let found = line.substring(start, end);
              let relativePos = pos.ch - start;
              const result = segmentit.doSegment(found);
              let chunkStart = 0,
                chunkEnd;
              for (const seg of result) {
                chunkEnd = chunkStart + seg.w.length;
                if (relativePos >= chunkStart && relativePos < chunkEnd) {
                  break;
                }
                chunkStart += seg.w.length;
              }
              end = chunkEnd + start;
              start = chunkStart + start;
              return new Range(Pos(pos.line, start), Pos(pos.line, end));
            }
          };
        },
      });
      this.register(unload);
    });
    window.ChsPatchAPI = undefined;
  }
}
