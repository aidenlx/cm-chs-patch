/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { EditorSelection } from "@codemirror/state";
import { SelectionRange } from "@codemirror/state";
import { EditorView, MouseSelectionStyle } from "@codemirror/view";

import type CMChsPatch from "../chsp-main";
import { groupAt } from "./from-src";
import { queryPos } from "./from-src";
import cm6GetChsSeg from "./get-seg";

export const getChsPatchExtension = (plugin: CMChsPatch) => {
  /** only accept double click */
  const rangeForClick = (
    view: EditorView,
    pos: number,
    bias: -1 | 1,
    type: number,
  ): SelectionRange =>
    cm6GetChsSeg(plugin, pos, groupAt(view.state, pos, bias), view.state);
  const dblClickPatch = EditorView.mouseSelectionStyle.of((view, event) => {
    // Only handle double clicks
    if (event.button !== 0 || event.detail !== 2) return null;

    // From https://github.com/codemirror/view/blob/0.19.30/src/input.ts#L464-L495
    let start = queryPos(view, event),
      type = event.detail; // not targeting ie, no need for polyfill
    let startSel = view.state.selection;
    let last = start,
      lastEvent: MouseEvent | null = event;
    return {
      update(update) {
        if (update.docChanged) {
          if (start) start.pos = update.changes.mapPos(start.pos);
          startSel = startSel.map(update.changes);
          lastEvent = null;
        }
      },
      get(event, extend, multiple) {
        let cur;
        if (
          lastEvent &&
          event.clientX == lastEvent.clientX &&
          event.clientY == lastEvent.clientY
        )
          cur = last;
        else {
          cur = last = queryPos(view, event);
          lastEvent = event;
        }
        if (!cur || !start) return startSel;
        let range = rangeForClick(view, cur.pos, cur.bias, type);
        if (start.pos != cur.pos && !extend) {
          let startRange = rangeForClick(view, start.pos, start.bias, type);
          let from = Math.min(startRange.from, range.from),
            to = Math.max(startRange.to, range.to);
          range =
            from < range.from
              ? EditorSelection.range(from, to)
              : EditorSelection.range(to, from);
        }
        if (extend)
          return startSel.replaceRange(
            startSel.main.extend(range.from, range.to),
          );
        else if (multiple) return startSel.addRange(range);
        else return EditorSelection.create([range]);
      },
    } as MouseSelectionStyle;
  });
  return [dblClickPatch];
};
