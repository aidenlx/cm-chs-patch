import { Modal, Notice } from "obsidian";

import type CMChsPatch from "./chsp-main";

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null));
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}

const colorSuccess = "var(--background-modifier-success)";

const wasmUrl =
  "https://unpkg.com/jieba-wasm@2.4.0/pkg/web/jieba_rs_wasm_bg.wasm";

export default class GoToDownloadModal extends Modal {
  selectButton: HTMLButtonElement | null = null;
  downloadButton: HTMLButtonElement | null = null;

  constructor(public plugin: CMChsPatch) {
    super(plugin.app);
    this.modalEl.addClass("zt-install-guide");
  }

  get libName() {
    return this.plugin.libName;
  }

  onOpen() {
    this.contentEl.createEl("h1", { text: "安装结巴分词" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText("新版分词插件需要安装 jieba-wasm，请按照下面的步骤安装：");
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          this.downloadButton = li.createEl(
            "button",
            { text: "自动下载" },
            (btn) => (btn.onclick = this.onDownloadingFile.bind(this)),
          );
          li.createEl("br");
          li.appendText("或");
          li.createEl("ol", {}, (ol) => {
            ol.createEl("li", {}, (li) => {
              li.appendText("点击链接手动下载");
              li.createEl("code", {
                text: this.libName,
              });
              li.createEl("br");
              li.createEl("a", { href: wasmUrl, text: wasmUrl });
            });
            ol.createEl("li", {}, (li) => {
              li.appendText("在弹出的窗口选择下载好的 ");
              li.createEl("code", { text: this.libName });
              li.appendText("  ");
              this.selectButton = li.createEl(
                "button",
                { text: "选择文件" },
                (btn) => (btn.onclick = this.onSelectingFile.bind(this)),
              );
            });
          });
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("重启 Obsidian 后生效");
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }

  async onSelectingFile() {
    const file = await pickFile(".wasm");
    if (!file || !file.name.toLowerCase().endsWith(".wasm")) return;
    await this.plugin.saveLib(await file.arrayBuffer());
    if (this.selectButton) {
      this.selectButton.setText("结巴分词插件导入成功");
      this.selectButton.style.backgroundColor = colorSuccess;
    }
    new Notice("✔️ 安装成功，请重启 Obsidian 使结巴分词生效");
  }
  async onDownloadingFile() {
    const resp = await fetch(wasmUrl);
    await this.plugin.saveLib(await resp.arrayBuffer());

    if (this.downloadButton) {
      this.downloadButton.setText("结巴分词插件下载成功");
      this.downloadButton.style.backgroundColor = colorSuccess;
    }
    new Notice("✔️ 安装成功，请重启 Obsidian 使结巴分词生效");
  }
}
