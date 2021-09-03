/* eslint-disable prefer-arrow/prefer-arrow-functions */
// From https://github.com/codemirror/CodeMirror/blob/master/src/model/selection.js

function cmp(a, b) {
  return a.line - b.line || a.ch - b.ch;
}
function maxPos(a, b) {
  return cmp(a, b) < 0 ? b : a;
}
function minPos(a, b) {
  return cmp(a, b) < 0 ? a : b;
}

export function Pos(line, ch, sticky = null) {
  if (!(this instanceof Pos)) return new Pos(line, ch, sticky);
  this.line = line;
  this.ch = ch;
  this.sticky = sticky;
}

export class Range {
  constructor(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  }

  from() {
    return minPos(this.anchor, this.head);
  }
  to() {
    return maxPos(this.anchor, this.head);
  }
  empty() {
    return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
  }
}
