// Adapted from Obsidian 1.14.4, lib/codemirror/vim.js, for Chinese segmentation.

import { isChs } from "./utils.js";
import type { Position } from "codemirror";
import type { VimApi, VimEditor, VimMotionArgs } from "./vim-types";

// 中英文标点映射
const chinesePunctuation: Record<string, string | undefined> = {
  ".": "。",
  ",": "，",
  ":": "：",
  ";": "；",
  "?": "？",
  "\\": "、",
  '"': "“",
  "<": "《",
  ">": "》",
  "[": "「",
  "]": "」",
  "(": "（",
  ")": "）",
};

export function utils({
  vim,
  CodeMirror,
  cut,
}: {
  CodeMirror: typeof import("codemirror");
  vim: VimApi;
  cut: (text: string) => string[];
}) {
  const vimGlobalState = vim.getVimGlobalState_();
  const Pos = CodeMirror.Pos;
  // #region adapted from Obsidian Vim word motions
  const wordCharTest = [
      CodeMirror.isWordChar,
      function (ch: string) {
        return !!ch && !CodeMirror.isWordChar(ch) && !/\s/.test(ch);
      },
    ],
    bigWordCharTest = [
      function (ch: string) {
        return /\S/.test(ch);
      },
    ];
  function recordLastCharacterSearch(increment: number, args: VimMotionArgs) {
    vimGlobalState.lastCharacterSearch.increment = increment;
    vimGlobalState.lastCharacterSearch.forward = args.forward;
    vimGlobalState.lastCharacterSearch.selectedCharacter =
      args.selectedCharacter;
  }
  function charIdxInLine(
    start: number,
    line: string,
    character: string,
    forward: boolean,
    includeChar: boolean,
  ) {
    // Search for char in line.
    // motion_options: {forward, includeChar}
    // If includeChar = true, include it too.
    // If forward = true, search forward, else search backwards.
    // If char is not found on this line, do nothing
    let idx: number;
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
  function copyCursor(cur: Position) {
    return new Pos(cur.line, cur.ch);
  }
  function isLine(cm: VimEditor, line: number) {
    return line >= cm.firstLine() && line <= cm.lastLine();
  }
  function lineLength(cm: VimEditor, lineNum: number) {
    return cm.getLine(lineNum).length;
  }
  function moveToWord(
    cm: VimEditor,
    cur: Position,
    repeat: number,
    forward: boolean,
    wordEnd: boolean,
    bigWord: boolean,
  ) {
    const curStart = copyCursor(cur);
    let cursor = cur;
    const words: { line: number; from: number; to: number }[] = [];
    const wordCount =
      repeat + ((forward && !wordEnd) || (!forward && wordEnd) ? 1 : 0);
    // For 'e', empty lines are not considered words, go figure.
    const emptyLineIsWord = !(forward && wordEnd);
    for (let i = 0; i < wordCount; i++) {
      const word = findWord(cm, cursor, forward, bigWord, emptyLineIsWord);
      if (!word) {
        const eodCh = lineLength(cm, cm.lastLine());
        words.push(
          forward
            ? { line: cm.lastLine(), from: eodCh, to: eodCh }
            : { line: 0, from: 0, to: 0 },
        );
        break;
      }
      words.push(word);
      cursor = new Pos(word.line, forward ? word.to - 1 : word.from);
    }
    const shortCircuit = words.length != wordCount;
    const firstWord = words[0];
    let lastWord = words.pop()!;
    if (forward && !wordEnd) {
      // w
      if (
        !shortCircuit &&
        (firstWord.from != curStart.ch || firstWord.line != curStart.line)
      ) {
        // We did not start in the middle of a word. Discard the extra word at the end.
        lastWord = words.pop()!;
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
        lastWord = words.pop()!;
      }
      return new Pos(lastWord.line, lastWord.to);
    } else {
      // b
      return new Pos(lastWord.line, lastWord.from);
    }
  }
  // #endregion

  // #region Chinese segmentation and punctuation changes
  function moveToCharacter(
    cm: VimEditor,
    repeat: number,
    forward: boolean,
    character: string,
    head?: Position,
  ) {
    const cur = head || cm.getCursor();
    let start = cur.ch;
    let idx: number | undefined;

    for (let i = 0; i < repeat; i++) {
      const line = cm.getLine(cur.line);
      idx = charIdxInLine(start, line, character, forward, true);

      // #region mod
      idx = indexWithChinesePunctuation(character, start, line, forward, idx);
      // #endregion
      if (idx == -1) {
        return null;
      }
      start = idx;
    }
    return new Pos(cm.getCursor().line, idx);
  }
  function findWord(
    cm: VimEditor,
    cur: Position,
    forward: boolean,
    bigWord: boolean,
    emptyLineIsWord: boolean,
  ) {
    let lineNum = cur.line;
    let pos = cur.ch;
    let line = cm.getLine(lineNum);
    const dir = forward ? 1 : -1;
    const charTests = bigWord ? bigWordCharTest : wordCharTest;

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
      const stop = dir > 0 ? line.length : -1;
      let wordStart = stop,
        wordEnd = stop;
      // Find bounds of next word.
      while (pos != stop) {
        let foundWord = false;
        // #region mod
        const from = Math.max(pos - 6, 0),
          to = Math.min(pos + 6, line.length);
        const text = line.slice(from, to);
        if (isChs(text)) {
          const segments = cut(line);
          for (let i = 0; i < charTests.length && !foundWord; ++i) {
            const currentChar = line.charAt(pos);
            let segment;
            if (!charTests[i](currentChar)) {
              if (currentChar === "") continue;
              segment = segmentAt(segments, pos);
              if (!charTests[i](segment.text)) continue;
            }
            wordStart = pos;
            while (pos != stop) {
              // 获取当前光标下的分词，跳过分隔字符
              segment = segmentAt(segments, pos);
              if (!charTests[i](segment.text)) break;
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
            if (!foundWord) continue;
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
        for (let i = 0; i < charTests.length && !foundWord; ++i) {
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

  function indexWithChinesePunctuation(
    character: string,
    start: number,
    line: string,
    forward: boolean,
    idx: number,
  ) {
    if (character.length == 1 && chinesePunctuation[character] != undefined) {
      const punctuation = chinesePunctuation[character];
      const punctuationIndex = charIdxInLine(
        start,
        line,
        punctuation,
        forward,
        true,
      );

      if (punctuationIndex == -1) {
        return idx;
      }
      if (idx == -1) {
        return punctuationIndex;
      }
      return forward
        ? Math.min(idx, punctuationIndex)
        : Math.max(idx, punctuationIndex);
    }
    return idx;
  }
  function segmentAt(segments: string[], pos: number) {
    let segment = "";
    let chunkBegin = 0,
      chunkEnd = 0;
    let index = 0;
    for (; index < segments.length; index++) {
      segment = segments[index];
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
