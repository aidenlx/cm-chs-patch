import CodeMirror from "obsidian/node_modules/@types/codemirror";

declare global {
  const CodeMirror: typeof CodeMirror;
}
