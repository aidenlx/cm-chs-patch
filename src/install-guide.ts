import { fileDialog } from "file-select-dialog";
import { Modal } from "obsidian";

import type CMChsPatch from "./chsp-main";

const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

export default class GoToDownloadModal extends Modal {
  reloadButton: HTMLButtonElement | null = null;
  selectButton: HTMLButtonElement | null = null;

  constructor(public plugin: CMChsPatch) {
    super(plugin.app);
    this.modalEl.addClass("zt-install-guide");
  }

  downloadLink = `https://github.com/aidenlx/cm-chs-patch/blob/master/assets/jiaba-wasm/${this.libName}.zip?raw=true`;
  lanzoumLink = "https://wwe.lanzoum.com/igUPR00jp02h";

  get libName() {
    return this.plugin.libName;
  }
  onOpen() {
    this.contentEl.createEl("h1", { text: "安装结巴分词" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText("新版分词插件需要安装 jieba-wasm，请按照下面的步骤安装：");
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          li.appendText("点击链接下载 ");
          li.createEl("code", {
            text: this.libName + ".zip",
          });
          li.createEl("br");
          li.appendText("从 ");
          li.createEl("a", { href: this.downloadLink, text: "GitHub" });
          li.appendText(" 或 ");
          li.createEl("a", { href: this.lanzoumLink, text: "蓝奏云" });
          li.appendText(" 下载");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("解压缩zip包得到 ");
          li.createEl("code", { text: this.libName });
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("在弹出的窗口选择 ");
          li.createEl("code", { text: this.libName });
          this.selectButton = li.createEl(
            "button",
            { text: "选择文件" },
            (btn) => (btn.onclick = this.onSelectingFile.bind(this)),
          );
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("重新加载分词插件: ");
          this.reloadButton = li.createEl(
            "button",
            { text: "重新加载" },
            (btn) => {
              btn.disabled = true;
              btn.style.backgroundColor = colorDisabled;
              btn.onclick = this.onReloadPlugin.bind(this);
            },
          );
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }

  async onSelectingFile() {
    const file = await fileDialog({
      multiple: false,
      accept: ".wasm",
      strict: true,
    });
    if (!file) return;
    await this.app.vault.adapter.writeBinary(
      this.plugin.libPath,
      await file.arrayBuffer(),
    );
    if (this.selectButton) {
      this.selectButton.setText("结巴分词导入成功");
      this.selectButton.style.backgroundColor = colorSuccess;
    }
    if (this.reloadButton) {
      this.reloadButton.disabled = false;
      this.reloadButton.style.backgroundColor = "";
    }
  }
  async onReloadPlugin() {
    await this.app.plugins.disablePlugin(this.plugin.manifest.id);
    this.close();
    await this.app.plugins.enablePlugin(this.plugin.manifest.id);
  }
}
