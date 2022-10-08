import type CodeMirror from "codemirror";
import { around } from "monkey-around";

import type CMChsPatch from "../chsp-main";

const patchGetWordAt = (plugin: CMChsPatch) => {
  if (!window.CodeMirror?.prototype) return null;
  return around(window.CodeMirror.prototype as CodeMirror.Editor, {
    findWordAt: (next) =>
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      function (
        this: CodeMirror.Editor,
        pos: CodeMirror.Position,
      ): CodeMirror.Range {
        const srcRange = next.call(this, pos);

        const cursor = this.indexFromPos(pos),
          fromPos = srcRange.from(),
          from = this.indexFromPos(fromPos),
          toPos = srcRange.to(),
          to = this.indexFromPos(toPos),
          text = this.getRange(fromPos, toPos);

        const result = plugin.getSegRangeFromCursor(cursor, { from, to, text });

        if (result) {
          const { from, to } = result;
          srcRange.anchor = this.posFromIndex(from);
          srcRange.head = this.posFromIndex(to);
        }
        return srcRange;
      },
  });
};

const setupCM5 = (plugin: CMChsPatch) => {
  const cm5PatchUnloader = patchGetWordAt(plugin);
  // patch only if cm5 is loaded
  cm5PatchUnloader && plugin.register(cm5PatchUnloader);
};
export default setupCM5;
