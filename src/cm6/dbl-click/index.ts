import { EditorSelection } from "@codemirror/state";
import type { SelectionRange } from "@codemirror/state";
import type { MouseSelectionStyle } from "@codemirror/view";
import { EditorView } from "@codemirror/view";

import type CMChsPatch from "../../chsp-main";
import cm6GetChsSeg from "../get-seg";
import { groupAt, queryPos } from "./from-src";

export const dblClickPatch = (plugin: CMChsPatch) => {
  /** only accept double click */
  const rangeForClick = (
    view: EditorView,
    pos: number,
    bias: -1 | 1,
    _type: number,
  ): SelectionRange => {
    const range = groupAt(view.state, pos, bias);
    // A hit on the right half of a character points after it. Keep the
    // segment lookup inside that character instead of the following word.
    const segmentPos = Math.max(range.from, pos - (bias < 0 ? 1 : 0));
    return cm6GetChsSeg(plugin, segmentPos, range, view.state) ?? range;
  };
  const dblClickPatch = EditorView.mouseSelectionStyle.of((view, event) => {
    // Only handle double clicks
    if (event.button !== 0 || event.detail !== 2) return null;

    // basicMouseSelection from @codemirror/view 6.43.13, src/input.ts.
    const start = queryPos(view, event),
      type = event.detail;
    let startSel = view.state.selection;
    return {
      update(update) {
        if (update.docChanged) {
          start.pos = update.changes.mapPos(start.pos);
          startSel = startSel.map(update.changes);
        }
      },
      get(event, extend, multiple) {
        const cur = queryPos(view, event);
        let range = rangeForClick(view, cur.pos, cur.bias, type);
        if (start.pos != cur.pos && !extend) {
          const startRange = rangeForClick(view, start.pos, start.bias, type);
          const from = Math.min(startRange.from, range.from),
            to = Math.max(startRange.to, range.to);
          range =
            from < range.from
              ? EditorSelection.range(from, to, range.assoc)
              : EditorSelection.range(to, from, range.assoc);
        }
        if (extend)
          return startSel.replaceRange(
            startSel.main.extend(range.from, range.to, range.assoc),
          );
        else if (multiple) return startSel.addRange(range);
        else return EditorSelection.create([range]);
      },
    } satisfies MouseSelectionStyle;
  });
  return dblClickPatch;
};
