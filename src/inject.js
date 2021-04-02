
export default function(pos) {
  function cmp(a, b) { return a.line - b.line || a.ch - b.ch }
  function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
  function minPos(a, b) { return cmp(a, b) < 0 ? a : b }
  
  function Pos(line, ch, sticky = null) {
    if (!(this instanceof Pos)) return new Pos(line, ch, sticky)
    this.line = line
    this.ch = ch
    this.sticky = sticky
  }
  
  class Range {
    constructor(anchor, head) {
      this.anchor = anchor; this.head = head
    }
  
    from() { return minPos(this.anchor, this.head) }
    to() { return maxPos(this.anchor, this.head) }
    empty() { return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch }
  }
  
  
  function isWordCharBasic(ch) {
    let nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/
    return /\w/.test(ch) || ch > "\x80" &&
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
  }
  
  function isWordChar(ch, helper) {
    if (!helper) return isWordCharBasic(ch)
    if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) return true
    return helper.test(ch)
  }
  
  function getLine(doc, n) {
    n -= doc.first
    if (n < 0 || n >= doc.size) throw new Error("There is no line " + (n + doc.first) + " in the document.")
    let chunk = doc
    while (!chunk.lines) {
      for (let i = 0;; ++i) {
        let child = chunk.children[i], sz = child.chunkSize()
        if (n < sz) { chunk = child; break }
        n -= sz
      }
    }
    return chunk.lines[n]
  }
  
  let doc = this.doc, line = getLine(doc, pos.line).text
  let start = pos.ch, end = pos.ch
  if (line) {
    let helper = this.getHelper(pos, "wordChars")
    if ((pos.sticky == "before" || end == line.length) && start) --start; else ++end
    let startChar = line.charAt(start)
    let check = isWordChar(startChar, helper)
      ? ch => isWordChar(ch, helper)
      : /\s/.test(startChar) ? ch => /\s/.test(ch)
      : ch => (!/\s/.test(ch) && !isWordChar(ch))
    while (start > 0 && check(line.charAt(start - 1))) --start
    while (end < line.length && check(line.charAt(end))) ++end
  }
  let found = line.substring(start, end);
  if (/[\u4e00-\u9fa5]/.test(found)) {
    console.log("chs char found, line: " + found);
    let relativePos = pos.ch - start;
    const segmentit = app.plugins.plugins["cm-chs-patch"].segmentit;
    const result = segmentit.doSegment(found);
    let chunkStart = 0,
      chunkEnd;
    for (const seg of result) {
      chunkEnd = chunkStart + seg.w.length;
      if (relativePos >= chunkStart && relativePos < chunkEnd) {
        break;
      }
      chunkStart += seg.w.length;
    }
    end = chunkEnd + start;
    start = chunkStart + start;
  } 
  return new Range(Pos(pos.line, start), Pos(pos.line, end))
}