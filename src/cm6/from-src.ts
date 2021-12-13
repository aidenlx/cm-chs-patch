/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { EditorView } from "@codemirror/view";
import { LineView } from "cm6-view-src/src/blockview";
import { Rect } from "cm6-view-src/src/dom";

// From https://github.com/codemirror/view/blob/0.19.30/src/input.ts

export { groupAt } from "cm6-view-src/src/cursor";
export { LineView };

let insideY = (y: number, rect: Rect) => y >= rect.top && y <= rect.bottom;
let inside = (x: number, y: number, rect: Rect) =>
  insideY(y, rect) && x >= rect.left && x <= rect.right;

// Try to determine, for the given coordinates, associated with the
// given position, whether they are related to the element before or
// the element after the position.
function findPositionSide(view: EditorView, pos: number, x: number, y: number) {
  let line = LineView.find((view as any).docView, pos);
  if (!line) return 1;
  let off = pos - line.posAtStart;
  // Line boundaries point into the line
  if (off == 0) return 1;
  if (off == line.length) return -1;

  // Positions on top of an element point at that element
  let before = line.coordsAt(off, -1);
  if (before && inside(x, y, before)) return -1;
  let after = line.coordsAt(off, 1);
  if (after && inside(x, y, after)) return 1;
  // This is probably a line wrap point. Pick before if the point is
  // beside it.
  return before && insideY(y, before) ? -1 : 1;
}

export function queryPos(
  view: EditorView,
  event: MouseEvent,
): { pos: number; bias: 1 | -1 } | null {
  let pos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
  return {
    pos,
    bias: findPositionSide(view, pos, event.clientX, event.clientY),
  };
}
