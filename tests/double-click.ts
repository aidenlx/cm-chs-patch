import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { dblClickPatch } from "../src/cm6/dbl-click";
import { groupAt, queryPos } from "../src/cm6/dbl-click/from-src";
import type CMChsPatch from "../src/chsp-main";

export function run() {
  const checks: string[] = [];
  const assert = (ok: boolean, name: string) => {
    if (!ok) throw new Error(name);
    checks.push(name);
  };
  const host = document.body.appendChild(document.createElement("div"));
  host.style.cssText =
    "position:fixed;left:10px;top:10px;width:180px;z-index:99999;background:white;color:black";
  // Keep the segmentation dependency deterministic. The test exercises the
  // actual mouse handler, position lookup, and selection dispatch.
  const plugin = {
    getSegRangeFromCursor(pos: number, range: { from: number; text: string }) {
      if (range.text !== "中文测试") return null;
      const from = range.from + (pos < range.from + 2 ? 0 : 2);
      return { from, to: from + 2 };
    },
  } as CMChsPatch;
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: "hello world 中文测试!!!\n\nwrap these words across several visual lines",
      extensions: [EditorView.lineWrapping, dblClickPatch(plugin)],
    }),
  });
  try {
    const click = (pos: number, fraction: number) => {
      const before = view.coordsAtPos(pos, 1)!;
      const after = view.coordsAtPos(pos + 1, -1)!;
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
        detail: 2,
        clientX: before.left + (after.left - before.left) * fraction,
        clientY: (before.top + before.bottom) / 2,
      });
      view.contentDOM.dispatchEvent(event);
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      return view.state.sliceDoc(
        view.state.selection.main.from,
        view.state.selection.main.to,
      );
    };
    assert(
      click(4, 0.8) === "hello",
      "right half of word-final character selects the word",
    );
    assert(
      click(6, 0.2) === "world",
      "left half of word-initial character selects the word",
    );
    assert(click(5, 0.5) === " ", "space selects its own group");
    assert(click(12, 0.2) === "中文", "Chinese double click uses segmentation");
    assert(click(14, 0.2) === "测试", "second Chinese segment is selected");
    assert(click(16, 0.5) === "!!!", "punctuation selects its own group");
    const wrapped = view.state.doc.toString().indexOf("several");
    assert(click(wrapped, 0.2) === "several", "wrapped word selects correctly");
    const empty = view.state.doc.line(2).from;
    assert(groupAt(view.state, empty).empty, "empty line produces a cursor");
    const emoji = EditorState.create({ doc: "a 👩‍🔬 b" });
    const range = groupAt(emoji, 2, 1);
    assert(
      emoji.sliceDoc(range.from, range.to) === "👩‍🔬",
      "grapheme cluster stays intact",
    );

    // Exercise the same query against Obsidian's own EditorView as well.
    const content = Array.from(
      document.querySelectorAll<HTMLElement>(".cm-content"),
    ).find((el) => !host.contains(el) && (el as any).cmTile);
    if (!content)
      throw new Error("Open a note in Obsidian before running this test");
    const live = (content as any).cmTile.root.view as EditorView;
    const rect = live.coordsAtPos(live.viewport.from)!;
    const event = new MouseEvent("mousedown", {
      clientX: rect.left,
      clientY: (rect.top + rect.bottom) / 2,
    });
    const expected = live.posAndSideAtCoords(
      { x: event.clientX, y: event.clientY },
      false,
    );
    const actual = queryPos(live, event);
    assert(
      actual.pos === expected.pos && actual.bias === expected.assoc,
      "Obsidian runtime position and side match the public method",
    );
    return checks;
  } finally {
    view.destroy();
    host.remove();
  }
}
