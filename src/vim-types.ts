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

export interface VimApi {
  defineMotion(
    name: string,
    motion: (
      cm: VimEditor,
      head: Position,
      args: VimMotionArgs,
    ) => Position | null,
  ): void;
  getVimGlobalState_(): {
    lastCharacterSearch: {
      increment: number;
      forward: boolean;
      selectedCharacter: string;
    };
  };
}
