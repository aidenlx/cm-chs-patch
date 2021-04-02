import { MarkdownView, Plugin, Editor } from "obsidian";
import { Segment, useDefault } from 'segmentit';
import findWordAt from 'inject'


export default class MyPlugin extends Plugin {

	segmentit:any;

  async onload() {
    console.log("loading plugin");

		this.segmentit = useDefault(new Segment())

    // 可以用来设置中文双击选择
    this.registerCodeMirror((cm: CodeMirror.Editor) => {
    	cm.findWordAt = findWordAt;
    });
  }

  onunload() {
    console.log("unloading plugin");
  }
}
