import { Plugin } from "obsidian";
import { Segment, useDefault } from "segmentit";

import { Pos, Range } from "./cm-extracted";

export default class CMChsPatch extends Plugin {
  segmentit: any;

  findWordAt_backup?: findWordAt;

  async onload() {
    console.log("loading cm-chs-patch");

    this.segmentit = useDefault(new Segment());

    this.registerCodeMirror((cm) => {
      if (this.findWordAt_backup === undefined)
        this.findWordAt_backup = cm.findWordAt;
      patch(cm, this.segmentit);
    });
  }

  onunload() {
    const restoreFWA = (cm: CodeMirror.Editor) => {
      if (this.findWordAt_backup)
        cm.findWordAt = this.findWordAt_backup.bind(cm);
      else throw new Error("findWordAt_backup not found");
    };
    this.app.workspace.iterateCodeMirrors(restoreFWA);
    console.log("unloading cm-chs-patch");
  }
}

type findWordAt = (pos: CodeMirror.Position) => CodeMirror.Range;

function patch(cm: CodeMirror.Editor, segmentit: any): void {
  const src = cm.findWordAt.bind(cm) as findWordAt;
  function findWordAtPatch(pos: CodeMirror.Position): CodeMirror.Range {
    // Used to control trim range
    const range = 6;

    const result = src(pos);

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
  }
  cm.findWordAt = findWordAtPatch;
}
