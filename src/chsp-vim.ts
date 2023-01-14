import type CMChsPatch from "../chsp-main";
import { cut as jiebaCut } from "./jieba";

export const VimPatcher = (plugin: CMChsPatch) => {
  const codeMirrorVimObject = (window as any).CodeMirrorAdapter?.Vim;

  function initialize() {
    setEnableMoveByChineseWords(
      (plugin.settings.useJieba || (window.Intl as any)?.Segmenter) &&
        plugin.settings.moveByChineseWords,
    );
    setEnableMoveTillChinesePunctuation(
      (plugin.settings.useJieba || (window.Intl as any)?.Segmenter) &&
        plugin.settings.moveTillChinesePunctuation,
    );
  }

  function setEnableMoveByChineseWords(enabled) {
    codeMirrorVimObject.defineMotion(
      "moveByWords",
      (cm: any, head: { line: any; ch: any }, motionArgs: object) => {
        return moveToWord(
          cm,
          head,
          motionArgs.repeat,
          !!motionArgs.forward,
          !!motionArgs.wordEnd,
          !!motionArgs.bigWord,
          enabled,
        );
      },
    );
  }

  function setEnableMoveTillChinesePunctuation(enabled) {
    codeMirrorVimObject.defineMotion(
      "moveToCharacter",
      (cm: any, head: { line: any; ch: any }, motionArgs: object) => {
        const repeat = motionArgs.repeat;
        recordLastCharacterSearch(0, motionArgs);
        return (
          moveToCharacter(
            cm,
            repeat,
            motionArgs.forward,
            motionArgs.selectedCharacter,
            enabled,
          ) || head
        );
      },
    );

    codeMirrorVimObject.defineMotion(
      "moveTillCharacter",
      (cm: any, head: { line: any; ch: any }, motionArgs: object) => {
        const repeat = motionArgs.repeat;
        const curEnd = moveToCharacter(
          cm,
          repeat,
          motionArgs.forward,
          motionArgs.selectedCharacter,
          enabled,
        );
        const increment = motionArgs.forward ? -1 : 1;
        recordLastCharacterSearch(increment, motionArgs);
        if (!curEnd) return null;
        curEnd.ch += increment;
        return curEnd;
      },
    );

    codeMirrorVimObject.defineMotion(
      "repeatLastCharacterSearch",
      (cm: any, head: { line: any; ch: any }, motionArgs: object) => {
        const vimGlobalState = codeMirrorVimObject.getVimGlobalState_();
        const lastSearch = vimGlobalState.lastCharacterSearch;
        const repeat = motionArgs.repeat;
        const forward = motionArgs.forward === lastSearch.forward;
        const increment = (lastSearch.increment ? 1 : 0) * (forward ? -1 : 1);
        cm.moveH(-increment, "char");
        motionArgs.inclusive = forward ? true : false;
        const curEnd = moveToCharacter(
          cm,
          repeat,
          forward,
          lastSearch.selectedCharacter,
          enabled,
        );
        if (!curEnd) {
          cm.moveH(increment, "char");
          return head;
        }
        curEnd.ch += increment;
        return curEnd;
      },
    );
  }

  /// /////////////////////////////////////////////////////////////////////////

  // fork vim.js
  function recordLastCharacterSearch(increment, args) {
    const vimGlobalState = codeMirrorVimObject.getVimGlobalState_();
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
    let idx;
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

  function moveToCharacter(
    cm,
    repeat,
    forward,
    character,
    moveToChinesePuncuation,
  ) {
    const cur = cm.getCursor();
    let start = cur.ch;
    let idx;
    // 中英文标点映射
    const chinese_punctuation_mapping = {
      ".": "。",
      ",": "，",
      ":": "：",
      '"': "“",
      "[": "「",
      "]": "」",
      "(": "（",
      ")": "）",
    };
    for (let i = 0; i < repeat; i++) {
      const line = cm.getLine(cur.line);
      idx = charIdxInLine(start, line, character, forward, true);

      if (
        moveToChinesePuncuation &&
        character.length == 1 &&
        chinese_punctuation_mapping[character] != undefined
      ) {
        const punc_char = chinese_punctuation_mapping[character];
        const punc_idx = charIdxInLine(start, line, punc_char, forward, true);

        if (punc_idx == -1) {
          idx = idx;
        } else if (idx == -1) {
          idx = punc_idx;
        } else {
          idx = forward ? Math.min(idx, punc_idx) : Math.max(idx, punc_idx);
        }
      }
      if (idx == -1) {
        return null;
      }
      start = idx;
    }
    return new Pos(cm.getCursor().line, idx);
  }

  function copyCursor(cur) {
    return new Pos(cur.line, cur.ch);
  }

  function moveToWord(
    cm,
    cur,
    repeat,
    forward,
    wordEnd,
    bigWord,
    moveToChineseWord,
  ) {
    const curStart = copyCursor(cur);
    const words = [];
    if ((forward && !wordEnd) || (!forward && wordEnd)) {
      repeat++;
    }
    // For 'e', empty lines are not considered words, go figure.
    const emptyLineIsWord = !(forward && wordEnd);
    for (let i = 0; i < repeat; i++) {
      const word = findWord(
        cm,
        cur,
        forward,
        bigWord,
        emptyLineIsWord,
        moveToChineseWord,
      );
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
      cur = new Pos(word.line, forward ? word.to - 1 : word.from);
    }
    const shortCircuit = words.length != repeat;
    const firstWord = words[0];
    let lastWord = words.pop();
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

  const wordCharTest = [
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

  function isLine(cm, line) {
    return line >= cm.firstLine() && line <= cm.lastLine();
  }

  function lineLength(cm, lineNum) {
    return cm.getLine(lineNum).length;
  }

  function cut(text) {
    if (!plugin.settings.useJieba && plugin.segmenter) {
      return Array.from(plugin.segmenter.segment(text)).map(
        (seg) => (seg as any).segment,
      );
    } else return jiebaCut(text, plugin.settings.hmm);
  }

  // from Obsidian 1.0.9
  // /Applications/Obsidian.app/Contents/Resources/obsidian.asar/lib/codemirror/vim.js
  function findWord(
    cm,
    cur,
    forward,
    bigWord,
    emptyLineIsWord,
    moveToChineseWord,
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

        const from = Math.max(pos - 6, 0),
          to = Math.min(pos + 6, line.length);
        const text = line.slice(from, to);

        // 中文行处理
        if (moveToChineseWord && /[\u4e00-\u9fff]/.test(text)) {
          var segments = cut(text);

          for (var i = 0; i < charTests.length && !foundWord; ++i) {
            if (charTests[i](line.charAt(pos))) {
              wordStart = pos;
              // Advance to end of word.
              var segment,
                segments = cut(line);
              while (pos != stop) {
                // 获取当前光标下的分词，跳过分隔字符
                segment = segmentAt(segments, pos);
                if (charTests[i](segment.text)) {
                  if (forward) {
                    pos = segment.end;
                    pos = Math.min(pos, stop);
                  } else {
                    segment = segmentAt(segments, Math.max(--pos, 0));
                    if (charTests[i](segment.text)) {
                      pos = segment.begin - 1;
                      pos = Math.max(pos, stop);
                    } else {
                      break;
                    }
                  }
                  break;
                }
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
              } else {
                return {
                  from: Math.min(wordStart, wordEnd + 1),
                  to: Math.max(wordStart, wordEnd),
                  line: lineNum,
                };
              }
            }
          }
        }

        // 英文行处理
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
      index: index,
      text: segment,
      begin: chunkBegin,
      end: chunkEnd,
    };
  }

  return { initialize: initialize };
};
