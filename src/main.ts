import { Plugin } from "obsidian";
import { Segment, useDefault } from 'segmentit';
import findWordAt from 'inject'


export default class CMChsPatch extends Plugin {

	segmentit:any;

  async onload() {
    console.log("loading cm-chs-patch");

		this.segmentit = useDefault(new Segment())

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
    	cm.findWordAt = findWordAt;
    });
  }

  onunload() {
    console.log("unloading cm-chs-patch");
  }
}
