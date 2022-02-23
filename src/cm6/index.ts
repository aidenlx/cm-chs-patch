/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { EditorState } from "@codemirror/state";
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
          return cm6GetChsSeg(plugin, pos, next.call(this, pos), this);
        },
    }),
  );
};
export default setupCM6;
