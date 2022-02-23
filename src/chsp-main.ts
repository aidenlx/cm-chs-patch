import { Plugin } from "obsidian";
import { Segment, useDefault } from "segmentit";

import patchGetWordAt from "./cm5";
import { getChsPatchExtension, getWordAtPatchUnloader } from "./cm6/index";

export default class CMChsPatch extends Plugin {
  segmentit: any;

  async onload() {
    console.log("loading cm-chs-patch");
    this.segmentit = useDefault(new Segment());

    // for cm5
    const cm5PatchUnloader = patchGetWordAt(this.segmentit);
    cm5PatchUnloader && this.register(cm5PatchUnloader);

    // for cm6
    this.registerEditorExtension(getChsPatchExtension(this.segmentit));
    this.register(getWordAtPatchUnloader(this.segmentit));
  }
}
