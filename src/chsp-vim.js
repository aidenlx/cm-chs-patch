// @ts-check
import { Component } from "obsidian";
import { utils } from "./vim-utils.js";

export class VimPatcher extends Component {
  /**
   * @param {import("./chsp-main.js").default} plugin
   */
  constructor(plugin) {
    super();
    this.plugin = plugin;
    this.utils = this.vim ? utils(
      {
        CodeMirror: window.CodeMirror,
        vim: this.vim,
        cut: plugin.cut.bind(plugin),
      },
    ) : null;
  }
  get vim() {
    return window.CodeMirrorAdapter?.Vim;
  }
  get enabled() {
    return (
      (this.plugin.settings.useJieba || window.Intl?.Segmenter)
    );
  }

  onload() {
    if (!this.vim || !this.utils) return;
    // only patch when enabled, so that default method is preserved when disabled
    // useful when obsidian updates breaks the patch and
    // user needs to disable patch to get vim working again
    if (this.enabled && this.plugin.settings.moveByChineseWords) {
      this.enableMoveByChineseWords(this.vim);
    }
    if (this.enabled && this.plugin.settings.moveTillChinesePunctuation) {
      this.enableMoveTillChinesePunctuation(this.vim);
    }
  }

  /**
   * @param {import("./vim-types").VimApi} vim
   */
  enableMoveByChineseWords(vim) {
    const helpers = this.utils;
    if (!helpers) return;
    vim.defineMotion("moveByWords", (cm, head, motionArgs) => {
      return helpers.moveToWord(
        cm,
        head,
        motionArgs.repeat,
        !!motionArgs.forward,
        !!motionArgs.wordEnd,
        !!motionArgs.bigWord
      );
    });
  }
  /**
   * @param {import("./vim-types").VimApi} vim
   */
  enableMoveTillChinesePunctuation(vim) {
    if (!this.utils) return;
    const { recordLastCharacterSearch, moveToCharacter } = this.utils;
    vim.defineMotion("moveToCharacter", (cm, head, motionArgs) => {
      const repeat = motionArgs.repeat;
      recordLastCharacterSearch(0, motionArgs);
      return (
        moveToCharacter(
          cm,
          repeat,
          motionArgs.forward,
          motionArgs.selectedCharacter,
          head
        ) || head
      );
    });

    vim.defineMotion("moveTillCharacter", (cm, head, motionArgs) => {
      const repeat = motionArgs.repeat;
      const curEnd = moveToCharacter(
        cm,
        repeat,
        motionArgs.forward,
        motionArgs.selectedCharacter,
        head
      );
      const increment = motionArgs.forward ? -1 : 1;
      recordLastCharacterSearch(increment, motionArgs);
      if (!curEnd) return null;
      curEnd.ch += increment;
      return curEnd;
    });

    vim.defineMotion("repeatLastCharacterSearch", (cm, head, motionArgs) => {
      const vimGlobalState = vim.getVimGlobalState_();
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
        lastSearch.selectedCharacter
      );
      if (!curEnd) {
        cm.moveH(increment, "char");
        return head;
      }
      curEnd.ch += increment;
      return curEnd;
    });
  }
}
