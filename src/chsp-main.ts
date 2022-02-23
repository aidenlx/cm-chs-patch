import { Plugin } from "obsidian";
import { Segment, useDefault } from "segmentit";

import setupCM5 from "./cm5";
import setupCM6 from "./cm6";

const RANGE_LIMIT = 6;

export default class CMChsPatch extends Plugin {
  segmentit: any;

  async onload() {
    console.log("loading cm-chs-patch");
    this.segmentit = useDefault(new Segment());

    setupCM5(this);
    setupCM6(this);
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
      const segResult = this.segmentit.doSegment(text);
      let chunkStart = 0,
        chunkEnd;
      const relativePos = cursor - from;

      for (const seg of segResult) {
        chunkEnd = chunkStart + seg.w.length;
        if (relativePos >= chunkStart && relativePos < chunkEnd) {
          break;
        }
        chunkStart += seg.w.length;
      }
      to = chunkEnd + from;
      from += chunkStart;
      return { from, to };
    }
  }
}
