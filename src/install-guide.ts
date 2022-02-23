import { fileDialog } from "file-select-dialog";
import { statSync } from "fs";
import type { App } from "obsidian";
import { Modal, Notice } from "obsidian";
import { join } from "path";

import { getConfigDirFunc, libName } from "./const";

const PLUGIN_ID = "cm-chs-patch";

const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

declare global {
  const app: App & { openWithDefaultApp(path: string): void };
}

const showInstallGuide = () => {
  // if platform is supported
  if (libName) {
    const LibPath = join(getConfigDirFunc(), libName);
    try {
      if (!statSync(LibPath).isFile()) {
        new Notice(
          `Path to jiaba library occupied, please check the location manually: ${
            getConfigDirFunc() + "/" + libName
          }`,
          2e3,
        );
      }
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        // if library file does not exist
        new GoToDownloadModal().open();
      } else {
        new Notice(error.toString());
      }
    }
  } else {
    new Notice(
      `Your device (${process.arch}-${process.platform}) is not supported by @node-rs/jieba`,
    );
  }
};
export default showInstallGuide;

const downloadLink = `https://github.com/aidenlx/cm-chs-patch/blob/master/assets/jieba/${libName}.zip?raw=true`;

class GoToDownloadModal extends Modal {
  reloadButton: HTMLButtonElement | null = null;
  selectButton: HTMLButtonElement | null = null;

  constructor() {
    super(app);
    this.modalEl.addClass("zt-install-guide");
  }
  onOpen() {
    const lib = libName;
    if (!lib) {
      this.contentEl.createEl("h1", {
        text: "Your platform is not supported by @node-rs/jieba",
      });
      return;
    }

    this.contentEl.createEl("h1", { text: "安装结巴分词" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText(
        "新版分词插件需要安装 @node-rs/jieba，请按照下面的步骤安装：",
      );
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          li.appendText("点击链接下载 ");
          li.createEl("code", {
            text: lib.replace(/\.node$/, "") + ".zip",
          });
          li.createEl("br");
          li.appendText("从 ");
          li.createEl("a", { href: downloadLink, text: "GitHub" });
          li.appendText(" 或 ");
          li.createEl("a", {
            href: "https://wwe.lanzoum.com/b01j6fw8h",
            text: "蓝奏云（密码b6p8）",
          });
          li.appendText(" 下载");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("解压缩zip包得到 ");
          li.createEl("code", { text: lib });
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("在弹出的窗口选择 ");
          li.createEl("code", { text: lib });
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
      accept: ".node",
      strict: true,
    });
    if (!file) return;
    await this.app.vault.adapter.writeBinary(
      app.vault.configDir + "/" + libName,
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
    await this.app.plugins.disablePlugin(PLUGIN_ID);
    this.close();
    await this.app.plugins.enablePlugin(PLUGIN_ID);
  }
}
