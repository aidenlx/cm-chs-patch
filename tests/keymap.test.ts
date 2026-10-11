import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSelection, EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { patchKeymap } from "../src/cm6/patch-keymap.ts";

for (const forward of [true, false]) {
  test(`Chinese group deletion ${forward ? "forward" : "backward"} preserves cursor affinity`, () => {
    const plugin = {
      getSegDestFromGroup(start: number, next: number) {
        assert.equal(next, forward ? 4 : 0);
        return forward ? start + 2 : start - 2;
      },
    };
    let state = EditorState.create({
      doc: "中文词语",
      selection: EditorSelection.cursor(forward ? 0 : 4),
      extensions: [patchKeymap(plugin)],
    });
    const binding = state
      .facet(keymap)
      .flat()
      .find((item) => item.key === (forward ? "Mod-Delete" : "Mod-Backspace"));
    assert.ok(binding?.run);
    assert.equal(
      binding.run({
        state,
        dispatch: (tr) => {
          state = tr.state;
        },
      }),
      true,
    );
    assert.equal(state.doc.toString(), forward ? "词语" : "中文");
    assert.equal(state.selection.main.head, forward ? 0 : 2);
    assert.equal(state.selection.main.assoc, forward ? 1 : -1);
  });
}
