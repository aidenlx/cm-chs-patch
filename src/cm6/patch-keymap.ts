/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type {
  EditorState,
  Transaction,
  CharCategory,
  StateCommand,
} from "@codemirror/state";
import { EditorSelection, findClusterBreak } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

import type CMChsPatch from "../chsp-main";

export const patchKeymap = (plugin: CMChsPatch) => {
  // based on https://github.com/codemirror/commands/releases/tag/6.1.1

  function deleteBy(target: CommandTarget, by: (start: number) => number) {
    if (target.state.readOnly) return false;
    let event = "delete.selection";
    const { state } = target;
    const changes = state.changeByRange((range) => {
      let { from, to } = range;
      if (from == to) {
        let towards = by(from);
        if (towards < from) {
          event = "delete.backward";
          towards = skipAtomic(target, towards, false);
        } else if (towards > from) {
          event = "delete.forward";
          towards = skipAtomic(target, towards, true);
        }
        from = Math.min(from, towards);
        to = Math.max(to, towards);
      } else {
        from = skipAtomic(target, from, false);
        to = skipAtomic(target, from, true);
      }
      return from == to
        ? { range }
        : { changes: { from, to }, range: EditorSelection.cursor(from) };
    });
    if (changes.changes.empty) return false;
    target.dispatch(
      state.update(changes, {
        scrollIntoView: true,
        userEvent: event,
        effects:
          event == "delete.selection"
            ? EditorView.announce.of(state.phrase("Selection deleted"))
            : undefined,
      }),
    );
    return true;
  }

  function skipAtomic(target: CommandTarget, pos: number, forward: boolean) {
    if (target instanceof EditorView)
      for (const ranges of target.state
        .facet(EditorView.atomicRanges)
        .map((f) => f(target)))
        ranges.between(pos, pos, (from, to) => {
          if (from < pos && to > pos) pos = forward ? to : from;
        });
    return pos;
  }

  const deleteByGroup = (target: CommandTarget, forward: boolean) =>
    deleteBy(target, (start) => {
      let pos = start;
      const { state } = target,
        line = state.doc.lineAt(pos);
      const categorize = state.charCategorizer(pos);
      for (let cat: CharCategory | null = null; ; ) {
        if (pos == (forward ? line.to : line.from)) {
          if (pos == start && line.number != (forward ? state.doc.lines : 1))
            pos += forward ? 1 : -1;
          break;
        }
        const next =
          findClusterBreak(line.text, pos - line.from, forward) + line.from;
        const nextChar = line.text.slice(
          Math.min(pos, next) - line.from,
          Math.max(pos, next) - line.from,
        );
        const nextCat = categorize(nextChar);
        if (cat != null && nextCat != cat) break;
        if (nextChar != " " || pos != start) cat = nextCat;
        pos = next;
      }
      // #region modified
      pos =
        plugin.getSegDestFromGroup(start, pos, state.sliceDoc.bind(state)) ??
        pos;
      // #endregion
      return pos;
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
