/* eslint-disable no-constant-condition */
// source: obsidian v1.1.12

import { isChs } from "./utils.js";

// 中英文标点映射
const chinese_punctuation_mapping = {
  ".": "。",
  ",": "，",
  ":": "：",
  ";": "；",
  '?': "？",
  "\\": "、",
  '"': "“",
  '<': "《",
  '>': "》",
  "[": "「",
  "]": "」",
  "(": "（",
  ")": "）",
};

/**
 *
 * @param {{CodeMirror: typeof import("codemirror"); vim: any; cut(text: string): any[]}} ctx
 */
export function utils({ vim, CodeMirror, cut }) {
  const vimGlobalState = vim.getVimGlobalState_();
  const Pos = CodeMirror.Pos;
  // #region from vim.js, no mod
  var wordCharTest = [
      CodeMirror.isWordChar,
      function (ch) {
        return ch && !CodeMirror.isWordChar(ch) && !/\s/.test(ch);
      },
    ],
    bigWordCharTest = [
      function (ch) {
        return /\S/.test(ch);
      },
    ];
  function recordLastCharacterSearch(increment, args) {
    vimGlobalState.lastCharacterSearch.increment = increment;
    vimGlobalState.lastCharacterSearch.forward = args.forward;
    vimGlobalState.lastCharacterSearch.selectedCharacter =
      args.selectedCharacter;
  }
  function charIdxInLine(start, line, character, forward, includeChar) {
    // Search for char in line.
    // motion_options: {forward, includeChar}
    // If includeChar = true, include it too.
    // If forward = true, search forward, else search backwards.
    // If char is not found on this line, do nothing
    var idx;
    if (forward) {
      idx = line.indexOf(character, start + 1);
      if (idx != -1 && !includeChar) {
        idx -= 1;
      }
    } else {
      idx = line.lastIndexOf(character, start - 1);
      if (idx != -1 && !includeChar) {
        idx += 1;
      }
    }
    return idx;
  }
  function copyCursor(cur) {
    return new Pos(cur.line, cur.ch);
  }
  function isLine(cm, line) {
    return line >= cm.firstLine() && line <= cm.lastLine();
  }
  function lineLength(cm, lineNum) {
    return cm.getLine(lineNum).length;
  }
  function moveToWord(cm, cur, repeat, forward, wordEnd, bigWord) {
    var curStart = copyCursor(cur);
    var words = [];
    if ((forward && !wordEnd) || (!forward && wordEnd)) {
      repeat++;
    }
    // For 'e', empty lines are not considered words, go figure.
    var emptyLineIsWord = !(forward && wordEnd);
    for (var i = 0; i < repeat; i++) {
      var word = findWord(cm, cur, forward, bigWord, emptyLineIsWord);
      if (!word) {
        var eodCh = lineLength(cm, cm.lastLine());
        words.push(
          forward
            ? { line: cm.lastLine(), from: eodCh, to: eodCh }
            : { line: 0, from: 0, to: 0 },
        );
        break;
      }
      words.push(word);
      cur = new Pos(word.line, forward ? word.to - 1 : word.from);
    }
    var shortCircuit = words.length != repeat;
    var firstWord = words[0];
    var lastWord = words.pop();
    if (forward && !wordEnd) {
      // w
      if (
        !shortCircuit &&
        (firstWord.from != curStart.ch || firstWord.line != curStart.line)
      ) {
        // We did not start in the middle of a word. Discard the extra word at the end.
        lastWord = words.pop();
      }
      return new Pos(lastWord.line, lastWord.from);
    } else if (forward && wordEnd) {
      return new Pos(lastWord.line, lastWord.to - 1);
    } else if (!forward && wordEnd) {
      // ge
      if (
        !shortCircuit &&
        (firstWord.to != curStart.ch || firstWord.line != curStart.line)
      ) {
        // We did not start in the middle of a word. Discard the extra word at the end.
        lastWord = words.pop();
      }
      return new Pos(lastWord.line, lastWord.to);
    } else {
      // b
      return new Pos(lastWord.line, lastWord.from);
    }
  }
  // #endregion

  // #region from vim.js, modefied
  function moveToCharacter(cm, repeat, forward, character) {
    const cur = cm.getCursor();
    let start = cur.ch;
    let idx;

    for (let i = 0; i < repeat; i++) {
      const line = cm.getLine(cur.line);
      idx = charIdxInLine(start, line, character, forward, true);

      // #region mod
      idx = idxbyChsPunctuation(character, start, line, forward, idx);
      // #endregion
      if (idx == -1) {
        return null;
      }
      start = idx;
    }
    return new Pos(cm.getCursor().line, idx);
  }
  function findWord(cm, cur, forward, bigWord, emptyLineIsWord) {
    var lineNum = cur.line;
    var pos = cur.ch;
    var line = cm.getLine(lineNum);
    var dir = forward ? 1 : -1;
    var charTests = bigWord ? bigWordCharTest : wordCharTest;

    if (emptyLineIsWord && line == "") {
      lineNum += dir;
      line = cm.getLine(lineNum);
      if (!isLine(cm, lineNum)) {
        return null;
      }
      pos = forward ? 0 : line.length;
    }

    while (true) {
      if (emptyLineIsWord && line == "") {
        return { from: 0, to: 0, line: lineNum };
      }
      var stop = dir > 0 ? line.length : -1;
      var wordStart = stop,
        wordEnd = stop;
      // Find bounds of next word.
      while (pos != stop) {
        var foundWord = false;
        // #region mod
        const from = Math.max(pos - 6, 0),
          to = Math.min(pos + 6, line.length);
        const text = line.slice(from, to);
        if (isChs(text)) {
          for (let i = 0; i < charTests.length && !foundWord; ++i) {
            if (!charTests[i](line.charAt(pos))) continue;
            wordStart = pos;
            const segments = cut(line);
            let segment;
            while (pos != stop) {
              // 获取当前光标下的分词，跳过分隔字符
              segment = segmentAt(segments, pos);
              if (!charTests[i](segment.text)) continue;
              if (forward) {
                pos = segment.end;
                pos = Math.min(pos, stop);
                break;
              }
              segment = segmentAt(segments, Math.max(--pos, 0));
              if (charTests[i](segment.text)) {
                pos = segment.begin - 1;
                pos = Math.max(pos, stop);
              }
              break;
            }
            wordEnd = pos;

            foundWord = wordStart != wordEnd;
            const foundEnd = forward
              ? Math.min(wordStart + dir, stop)
              : Math.max(wordStart + dir, stop);
            // 如果光标在分词结尾字符（ +1 字符越界），跳过当前分词，查找下一个分词
            if (
              wordStart == cur.ch &&
              lineNum == cur.line &&
              wordEnd == foundEnd
            ) {
              // We started at the end of a word. Find the next one.
              continue;
            }
            return {
              from: Math.min(wordStart, wordEnd + 1),
              to: Math.max(wordStart, wordEnd),
              line: lineNum,
            };
          }
        }
        // #endregion
        for (var i = 0; i < charTests.length && !foundWord; ++i) {
          if (charTests[i](line.charAt(pos))) {
            wordStart = pos;
            // Advance to end of word.
            while (pos != stop && charTests[i](line.charAt(pos))) {
              pos += dir;
            }
            wordEnd = pos;
            foundWord = wordStart != wordEnd;
            if (
              wordStart == cur.ch &&
              lineNum == cur.line &&
              wordEnd == wordStart + dir
            ) {
              // We started at the end of a word. Find the next one.
              continue;
            } else {
              return {
                from: Math.min(wordStart, wordEnd + 1),
                to: Math.max(wordStart, wordEnd),
                line: lineNum,
              };
            }
          }
        }
        if (!foundWord) {
          pos += dir;
        }
      }
      // Advance to next/prev line.
      lineNum += dir;
      if (!isLine(cm, lineNum)) {
        return null;
      }
      line = cm.getLine(lineNum);
      pos = dir > 0 ? 0 : line.length;
    }
  }

  // #endregion

  /** custom function */
  function idxbyChsPunctuation(character, start, line, forward, idx) {
    if (
      character.length == 1 &&
      chinese_punctuation_mapping[character] != undefined
    ) {
      const punc_char = chinese_punctuation_mapping[character];
      const punc_idx = charIdxInLine(start, line, punc_char, forward, true);

      if (punc_idx == -1) {
        return idx;
      }
      if (idx == -1) {
        return punc_idx;
      }
      return forward ? Math.min(idx, punc_idx) : Math.max(idx, punc_idx);
    }
    return idx;
  }
  function segmentAt(segments, pos) {
    let chunkBegin = 0,
      chunkEnd = 0;
    for (var index = 0; index < segments.length; index++) {
      var segment = segments[index];
      chunkEnd = chunkBegin + segment.length;
      if (pos >= chunkBegin && pos < chunkEnd) {
        break;
      }
      chunkBegin += segment.length;
    }

    return {
      index,
      text: segment,
      begin: chunkBegin,
      end: chunkEnd,
    };
  }

  return {
    moveToCharacter,
    recordLastCharacterSearch,
    moveToWord,
  };
}
