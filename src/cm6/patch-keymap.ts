/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { EditorState, Transaction } from "@codemirror/state";
import { CharCategory, EditorSelection, StateCommand } from "@codemirror/state";
import { findClusterBreak } from "@codemirror/text";
import { EditorView, keymap, PluginField } from "@codemirror/view";

import type CMChsPatch from "../chsp-main";

export const patchKeymap = (plugin: CMChsPatch) => {
  // based on https://github.com/codemirror/commands/releases/tag/0.19.8

  function deleteBy(
    { state, dispatch }: CommandTarget,
    by: (start: number) => number,
  ) {
    if (state.readOnly) return false;
    let event = "delete.selection";
    let changes = state.changeByRange((range) => {
      let { from, to } = range;
      if (from == to) {
        let towards = by(from);
        if (towards < from) event = "delete.backward";
        else if (towards > from) event = "delete.forward";
        from = Math.min(from, towards);
        to = Math.max(to, towards);
      }
      return from == to
        ? { range }
        : { changes: { from, to }, range: EditorSelection.cursor(from) };
    });
    if (changes.changes.empty) return false;
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: event }));
    return true;
  }

  function skipAtomic(target: CommandTarget, pos: number, forward: boolean) {
    if (target instanceof EditorView)
      for (let ranges of target.pluginField(PluginField.atomicRanges))
        ranges.between(pos, pos, (from, to) => {
          if (from < pos && to > pos) pos = forward ? to : from;
        });
    return pos;
  }

  const deleteByGroup = (target: CommandTarget, forward: boolean) =>
    deleteBy(target, (start) => {
      let pos = start,
        { state } = target,
        line = state.doc.lineAt(pos);
      let categorize = state.charCategorizer(pos);
      for (let cat: CharCategory | null = null; ; ) {
        if (pos == (forward ? line.to : line.from)) {
          if (pos == start && line.number != (forward ? state.doc.lines : 1))
            pos += forward ? 1 : -1;
          break;
        }
        let next =
          findClusterBreak(line.text, pos - line.from, forward) + line.from;
        let nextChar = line.text.slice(
          Math.min(pos, next) - line.from,
          Math.max(pos, next) - line.from,
        );
        let nextCat = categorize(nextChar);
        if (cat != null && nextCat != cat) break;
        if (nextChar != " " || pos != start) cat = nextCat;
        pos = next;
      }
      //#region modified
      pos =
        plugin.getSegRangeFromGroup(start, pos, state.sliceDoc.bind(state)) ??
        pos;
      //#endregion
      return skipAtomic(target, pos, forward);
    });

  /// Delete the selection or backward until the end of the next
  /// [group](#view.EditorView.moveByGroup), only skipping groups of
  /// whitespace when they consist of a single space.
  const deleteGroupBackward: StateCommand = (target) =>
    deleteByGroup(target, false);
  /// Delete the selection or forward until the end of the next group.
  const deleteGroupForward: StateCommand = (target) =>
    deleteByGroup(target, true);

  type CommandTarget = {
    state: EditorState;
    dispatch: (tr: Transaction) => void;
  };

  return keymap.of([
    { key: "Ctrl-Alt-h", run: deleteGroupBackward },
    { key: "Mod-Backspace", mac: "Alt-Backspace", run: deleteGroupBackward },
    { key: "Mod-Delete", mac: "Alt-Delete", run: deleteGroupForward },
  ]);
};
