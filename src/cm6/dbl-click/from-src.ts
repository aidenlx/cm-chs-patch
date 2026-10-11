/*!
MIT License

Copyright (C) 2018-2021 by Marijn Haverbeke <marijn@haverbeke.berlin> and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
import {
  EditorSelection,
  findClusterBreak,
  type EditorState,
} from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

// groupAt from @codemirror/view 6.43.13, src/cursor.ts.
// https://code.haverbeke.berlin/codemirror/view/src/tag/6.43.13/src/cursor.ts
export function groupAt(state: EditorState, pos: number, bias: 1 | -1 = 1) {
  let categorize = state.charCategorizer(pos);
  let line = state.doc.lineAt(pos),
    linePos = pos - line.from;
  if (line.length == 0) return EditorSelection.cursor(pos);
  const side = linePos == 0 ? 1 : linePos == line.length ? -1 : bias;
  let from = linePos,
    to = linePos;
  if (side < 0) from = findClusterBreak(line.text, linePos, false);
  else to = findClusterBreak(line.text, linePos);
  let cat = categorize(line.text.slice(from, to));
  while (from > 0) {
    let prev = findClusterBreak(line.text, from, false);
    if (categorize(line.text.slice(prev, from)) != cat) break;
    from = prev;
  }
  while (to < line.length) {
    let next = findClusterBreak(line.text, to);
    if (categorize(line.text.slice(to, next)) != cat) break;
    to = next;
  }
  return EditorSelection.undirectionalRange(from + line.from, to + line.from);
}

export function queryPos(
  view: EditorView,
  event: MouseEvent,
): { pos: number; bias: 1 | -1 } {
  const { pos, assoc } = view.posAndSideAtCoords(
    { x: event.clientX, y: event.clientY },
    false,
  );
  return { pos, bias: assoc };
}
