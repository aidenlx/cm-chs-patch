import type CodeMirror from "codemirror";
import { around } from "monkey-around";
import type { useDefault } from "segmentit";

import { getChsSegFromRange } from "../get-chs-seg";

const patchGetWordAt = (seg: ReturnType<typeof useDefault>) => {
  if (!window.CodeMirror?.prototype) return null;
  return around(window.CodeMirror.prototype as CodeMirror.Editor, {
    findWordAt: (next) =>
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      function (
        this: CodeMirror.Editor,
        pos: CodeMirror.Position,
      ): CodeMirror.Range {
        let srcRange = next.call(this, pos);

        const cursor = this.indexFromPos(pos),
          fromPos = srcRange.from(),
          from = this.indexFromPos(fromPos),
          toPos = srcRange.to(),
          to = this.indexFromPos(toPos),
          text = this.getRange(fromPos, toPos);

        const chsSegResult = getChsSegFromRange(
          cursor,
          { from, to, text },
          seg,
        );

        if (chsSegResult) {
          const { from, to } = chsSegResult;
          srcRange.anchor = this.posFromIndex(from);
          srcRange.head = this.posFromIndex(to);
        }
        return srcRange;
      },
  });
};
export default patchGetWordAt;
