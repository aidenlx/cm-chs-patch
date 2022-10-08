/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { SelectionRange } from "@codemirror/state";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { around } from "monkey-around";

import type CMChsPatch from "../chsp-main";
import { getChsPatchExtension } from "./chs-extension";
import cm6GetChsSeg from "./get-seg";

const setupCM6 = (plugin: CMChsPatch) => {
  plugin.registerEditorExtension(getChsPatchExtension(plugin));
  // wordAt monkey patch
  plugin.register(
    around(EditorState.prototype, {
      wordAt: (next) =>
        function (this: EditorState, pos: number) {
          const srcRange = next.call(this, pos);
          return (
            cm6GetChsSeg(plugin, pos, next.call(this, pos), this) ?? srcRange
          );
        },
    }),
  );
  plugin.register(
    around(EditorView.prototype, {
      moveByGroup: (next) =>
        function (this: EditorView, start: SelectionRange, forward: boolean) {
          const dest = next.call(this, start, forward);
          if (dest.empty && start.empty) {
            const destPos = plugin.getSegRangeFromGroup(
              start.from,
              dest.from,
              this.state.sliceDoc.bind(this.state),
            );
            if (destPos) return EditorSelection.range(destPos, destPos);
          }
          return dest;
        },
    }),
  );
};
export default setupCM6;
