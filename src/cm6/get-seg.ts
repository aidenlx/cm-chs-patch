import {
  EditorSelection,
  EditorState,
  SelectionRange,
} from "@codemirror/state";

import type CMChsPatch from "../chsp-main";

const cm6GetChsSeg = (
  plugin: CMChsPatch,
  pos: number,
  srcRange: { from: number; to: number } | null,
  state: EditorState,
): SelectionRange | null => {
  if (!srcRange) return null;
  const { from, to } = srcRange,
    text = state.doc.sliceString(from, to);

  const chsSegResult = plugin.getSegRangeFromCursor(pos, { from, to, text });
  if (chsSegResult) {
    return EditorSelection.range(chsSegResult.from, chsSegResult.to);
  } else {
    return null;
  }
};

export default cm6GetChsSeg;
