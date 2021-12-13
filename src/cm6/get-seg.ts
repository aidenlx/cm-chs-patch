import {
  EditorSelection,
  EditorState,
  SelectionRange,
} from "@codemirror/state";
import type { useDefault } from "segmentit";

import { getChsSegFromRange } from "../get-chs-seg";

export default function cm6GetChsSeg(
  pos: number,
  srcRange: SelectionRange,
  state: EditorState,
  seg: ReturnType<typeof useDefault>,
): SelectionRange;
export default function cm6GetChsSeg(
  pos: number,
  srcRange: SelectionRange | null,
  state: EditorState,
  seg: ReturnType<typeof useDefault>,
): SelectionRange | null;
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export default function cm6GetChsSeg(
  pos: number,
  srcRange: SelectionRange | null,
  state: EditorState,
  seg: ReturnType<typeof useDefault>,
): SelectionRange | null {
  if (!srcRange) return null;
  const { from, to } = srcRange,
    text = state.doc.sliceString(from, to);

  const chsSegResult = getChsSegFromRange(pos, { from, to, text }, seg);
  if (chsSegResult) {
    return EditorSelection.range(chsSegResult.from, chsSegResult.to);
  } else {
    return srcRange;
  }
}
