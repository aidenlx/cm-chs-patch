import { Plugin } from "obsidian";
import pinyin from "pinyinlite";
import { Segment, useDefault } from "segmentit";

import { API_NAME, ChsPatchAPI, Evt_ApiReady } from "./api";
import patchGetWordAt from "./cm5";
import getChsPatch from "./cm6/index";

const API_NAME: API_NAME extends keyof typeof window ? API_NAME : never =
  "ChsPatchAPI" as const; // this line will throw error when name out of sync
const chsRegex = /[\u4e00-\u9fa5]/g;

export default class CMChsPatch extends Plugin {
  api?: ChsPatchAPI;

  segmentit: any;

  async onload() {
    console.log("loading cm-chs-patch");
    this.segmentit = useDefault(new Segment());

    this.loadApi();

    const cm5PatchUnloader = patchGetWordAt(this.segmentit);
    if (cm5PatchUnloader) {
      this.register(cm5PatchUnloader);
    }
    this.registerEditorExtension(getChsPatch(this.segmentit));
  }

  loadApi() {
    const api = { pinyin, chsRegex };
    this.api = api;
    window[API_NAME] = api;
    this.register(() => (window[API_NAME] = undefined));
    console.log("ChsPatch API ready");

    this.app.metadataCache.trigger(...(<Evt_ApiReady>["chs-patch:ready", api]));
  }
}
