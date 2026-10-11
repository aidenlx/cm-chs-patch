import { Component } from "obsidian";
import { around } from "monkey-around";
import { utils } from "./vim-utils";
import type CMChsPatch from "./chsp-main";
import type { VimApi, VimMotion, VimMotionName } from "./vim-types";

// Obsidian's motion table is private; lastMotion exposes the callback after use.
// Probe a temporary editor and mapping without touching any vault document.
function getMotion(vim: VimApi, name: VimMotionName): VimMotion {
  const container = createDiv();
  const textarea = container.createEl("textarea");
  textarea.value = "one,two,three";
  const cm = window.CodeMirror.fromTextArea(textarea);
  const key = "<cm-chs-patch-capture-motion>";
  const state = vim.getVimGlobalState_();
  const lastSearch = state.lastCharacterSearch;
  state.lastCharacterSearch = {
    increment: 0,
    forward: true,
    selectedCharacter: ",",
  };
  try {
    vim.mapCommand(key, "motion", name, {
      forward: true,
      selectedCharacter: ",",
    });
    vim.handleKey(cm, key, "mapping");
    const motion: unknown = cm.state.vim?.lastMotion;
    if (typeof motion !== "function")
      throw new Error(`Unable to capture Vim motion: ${name}`);
    return motion as VimMotion;
  } finally {
    vim.unmap(key);
    state.lastCharacterSearch = lastSearch;
    cm.toTextArea();
  }
}

export class VimPatcher extends Component {
  private readonly utils: ReturnType<typeof utils> | null;

  constructor(private readonly plugin: CMChsPatch) {
    super();
    this.utils = this.vim
      ? utils({
          CodeMirror: window.CodeMirror,
          vim: this.vim,
          cut: plugin.cut.bind(plugin),
        })
      : null;
  }
  get vim() {
    return window.CodeMirrorAdapter?.Vim;
  }
  get enabled() {
    return this.plugin.settings.useJieba || !!window.Intl?.Segmenter;
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

  private patchMotion(vim: VimApi, name: VimMotionName, motion: VimMotion) {
    const target = { motion: getMotion(vim, name) };
    // Track later registrations so unloading does not replace another plugin's motion.
    const stopTracking = around(vim, {
      defineMotion: (next) =>
        function (this: VimApi, motionName: string, nextMotion: VimMotion) {
          if (motionName === name) target.motion = nextMotion;
          next.call(this, motionName, nextMotion);
        },
    });
    const remove = around(target, { motion: () => motion });
    vim.defineMotion(name, target.motion);
    this.register(() => {
      remove();
      try {
        vim.defineMotion(name, target.motion);
      } finally {
        stopTracking();
      }
    });
  }

  enableMoveByChineseWords(vim: VimApi) {
    const helpers = this.utils;
    if (!helpers) return;
    this.patchMotion(vim, "moveByWords", (cm, head, motionArgs) => {
      return helpers.moveToWord(
        cm,
        head,
        motionArgs.repeat,
        !!motionArgs.forward,
        !!motionArgs.wordEnd,
        !!motionArgs.bigWord,
      );
    });
  }
  enableMoveTillChinesePunctuation(vim: VimApi) {
    if (!this.utils) return;
    const { recordLastCharacterSearch, moveToCharacter } = this.utils;
    this.patchMotion(vim, "moveToCharacter", (cm, head, motionArgs) => {
      const repeat = motionArgs.repeat;
      recordLastCharacterSearch(0, motionArgs);
      return (
        moveToCharacter(
          cm,
          repeat,
          motionArgs.forward,
          motionArgs.selectedCharacter,
          head,
        ) || head
      );
    });

    this.patchMotion(vim, "moveTillCharacter", (cm, head, motionArgs) => {
      const repeat = motionArgs.repeat;
      const curEnd = moveToCharacter(
        cm,
        repeat,
        motionArgs.forward,
        motionArgs.selectedCharacter,
        head,
      );
      const increment = motionArgs.forward ? -1 : 1;
      recordLastCharacterSearch(increment, motionArgs);
      if (!curEnd) return null;
      curEnd.ch += increment;
      return curEnd;
    });

    this.patchMotion(
      vim,
      "repeatLastCharacterSearch",
      (cm, head, motionArgs) => {
        const vimGlobalState = vim.getVimGlobalState_();
        const lastSearch = vimGlobalState.lastCharacterSearch;
        const repeat = motionArgs.repeat;
        const forward = motionArgs.forward === lastSearch.forward;
        const increment = (lastSearch.increment ? 1 : 0) * (forward ? -1 : 1);
        cm.moveH(-increment, "char");
        motionArgs.inclusive = forward;
        const curEnd = moveToCharacter(
          cm,
          repeat,
          forward,
          lastSearch.selectedCharacter,
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
}
