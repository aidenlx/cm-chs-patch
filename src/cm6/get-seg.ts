import {
  EditorSelection,
  EditorState,
  SelectionRange,
} from "@codemirror/state";

import type CMChsPatch from "../chsp-main";

export default function cm6GetChsSeg(
  plugin: CMChsPatch,
  pos: number,
  srcRange: SelectionRange,
  state: EditorState,
): SelectionRange;
export default function cm6GetChsSeg(
  plugin: CMChsPatch,
  pos: number,
  srcRange: SelectionRange | null,
  state: EditorState,
): SelectionRange | null;
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export default function cm6GetChsSeg(
  plugin: CMChsPatch,
  pos: number,
  srcRange: SelectionRange | null,
  state: EditorState,
): SelectionRange | null {
  if (!srcRange) return null;
  const { from, to } = srcRange,
    text = state.doc.sliceString(from, to);

  const chsSegResult = plugin.getChsSegFromRange(pos, { from, to, text });
  if (chsSegResult) {
    return EditorSelection.range(chsSegResult.from, chsSegResult.to);
  } else {
    return srcRange;
  }
}
