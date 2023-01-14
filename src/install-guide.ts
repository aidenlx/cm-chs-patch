import { fileDialog } from "file-select-dialog";
import { Modal, Notice, requestUrl } from "obsidian";
import { unzip } from "unzipit";

import type CMChsPatch from "./chsp-main";

const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

export default class GoToDownloadModal extends Modal {
  reloadButton: HTMLButtonElement | null = null;
  selectButton: HTMLButtonElement | null = null;
  downloadButton: HTMLButtonElement | null = null;

  constructor(public plugin: CMChsPatch) {
    super(plugin.app);
    this.modalEl.addClass("zt-install-guide");
  }

  downloadLink = `https://raw.githubusercontent.com/aidenlx/cm-chs-patch/main/assets/jiaba-wasm/${this.libName}.zip`;
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
          li.appendText(" 手动下载");
          li.appendText(" 或 ");

          this.downloadButton = li.createEl(
            "button",
            { text: "自动下载" },
            (btn) => (btn.onclick = this.onDownloadingFile.bind(this)),
          );
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("解压缩 zip 包得到 ");
          li.createEl("code", { text: this.libName });
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("在弹出的窗口选择 ");
          li.createEl("code", { text: this.libName });
          li.appendText("  ");
          this.selectButton = li.createEl(
            "button",
            { text: "选择文件" },
            (btn) => (btn.onclick = this.onSelectingFile.bind(this)),
          );
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("重新加载分词插件:  ");
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
      this.selectButton.setText("结巴分词插件导入成功");
      this.selectButton.style.backgroundColor = colorSuccess;
    }
    if (this.reloadButton) {
      this.reloadButton.disabled = false;
      this.reloadButton.style.backgroundColor = "";
    }
  }
  async onDownloadingFile() {
    if (this.reloadButton) {
      this.reloadButton.disabled = true;
      this.reloadButton.style.backgroundColor = colorDisabled;
    }

    const resp = await requestUrl({
      url: this.downloadLink,
      contentType: "application/octet-stream",
    });
    const { entries } = await unzip(resp.arrayBuffer);
    if (entries[`${this.libName}`]) {
      await this.app.vault.adapter.writeBinary(
        this.plugin.libPath,
        await entries[`${this.libName}`].arrayBuffer(),
      );
    }

    if (this.selectButton) {
      this.selectButton.setText("结巴分词插件导入成功");
      this.selectButton.style.backgroundColor = colorSuccess;
    }
    if (this.reloadButton) {
      this.reloadButton.disabled = false;
      this.reloadButton.style.backgroundColor = "";
    }
  }
  async onReloadPlugin() {
    if (await app.vault.adapter.exists(this.plugin.libPath, true)) {
      const stat = await app.vault.adapter.stat(this.plugin.libPath);
      if (stat && stat.type == "file" && stat.size > 0) {
        await this.app.plugins.disablePlugin(this.plugin.manifest.id);
        this.close();
        await this.app.plugins.enablePlugin(this.plugin.manifest.id);
        await this.app.setting.openTabById(this.plugin.manifest.id);
      }
      new Notice("✔️ 安装结巴分词插件成功");
    } else {
      new Notice("❌ 安装结巴分词插件失败");
    }
  }
}
