import { EditorSelection, SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { useDefault } from "segmentit";

import { groupAt, LineView } from "./from-src";

const range = 6;

/** only accept double click */
const rangeForClick = (
  view: EditorView,
  pos: number,
  bias: -1 | 1,
  type: number,
  seg: ReturnType<typeof useDefault>,
): SelectionRange => {
  // Double click
  const originalRange = groupAt(view.state, pos, bias);
  let { from, to } = originalRange,
    selectedText = view.state.doc.sliceString(from, to);
  if (!/[\u4e00-\u9fa5]/.test(selectedText)) {
    return originalRange;
  } else {
    // trim long text
    if (pos - from > range) {
      const newFrom = pos - range;
      selectedText = selectedText.slice(newFrom - from);
      from = newFrom;
    }
    if (to - pos > range) {
      const newTo = pos + range;
      selectedText = selectedText.slice(0, newTo - to);
      to = newTo;
    }
    const segResult = seg.doSegment(selectedText);
    let chunkStart = 0,
      chunkEnd;
    const relativePos = pos - from;

    for (const seg of segResult) {
      chunkEnd = chunkStart + seg.w.length;
      if (relativePos >= chunkStart && relativePos < chunkEnd) {
        break;
      }
      chunkStart += seg.w.length;
    }
    to = chunkEnd + from;
    from += chunkStart;
    return EditorSelection.range(from, to);
  }
};

export default rangeForClick;
