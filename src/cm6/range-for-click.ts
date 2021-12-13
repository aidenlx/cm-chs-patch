import { EditorSelection, SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { useDefault } from "segmentit";

import { getChsSegFromRange } from "../get-chs-seg";
import { groupAt } from "./from-src";

/** only accept double click */
const rangeForClick = (
  view: EditorView,
  pos: number,
  bias: -1 | 1,
  type: number,
  seg: ReturnType<typeof useDefault>,
): SelectionRange => {
  // Double click
  const srcRange = groupAt(view.state, pos, bias),
    { from, to } = srcRange,
    text = view.state.doc.sliceString(from, to);

  const chsSegResult = getChsSegFromRange(pos, { from, to, text }, seg);
  if (chsSegResult) {
    return EditorSelection.range(chsSegResult.from, chsSegResult.to);
  } else {
    return srcRange;
  }
};

export default rangeForClick;
