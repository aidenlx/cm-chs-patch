import type { Editor, Position } from "codemirror";

export interface VimMotionArgs {
  repeat: number;
  forward: boolean;
  selectedCharacter: string;
  wordEnd?: boolean;
  bigWord?: boolean;
  inclusive?: boolean;
}

export interface VimEditor extends Editor {
  moveH(amount: number, unit: "char"): void;
}

export type VimMotion = (
  cm: VimEditor,
  head: Position,
  args: VimMotionArgs,
) => Position | null;

export type VimMotionName =
  | "moveByWords"
  | "moveToCharacter"
  | "moveTillCharacter"
  | "repeatLastCharacterSearch";

export interface VimApi {
  defineMotion(name: string, motion: VimMotion): void;
  handleKey(cm: Editor, key: string, origin?: string): unknown;
  mapCommand(
    key: string,
    type: "motion",
    name: string,
    args: Partial<VimMotionArgs>,
  ): void;
  unmap(key: string): void;
  getVimGlobalState_(): {
    lastCharacterSearch: {
      increment: number;
      forward: boolean;
      selectedCharacter: string;
    };
  };
}
