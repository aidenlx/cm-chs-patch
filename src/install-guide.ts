import { Modal, Notice, requestUrl } from "obsidian";

import type CMChsPatch from "./chsp-main";

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = createEl("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null));
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}

const wasmUrl = `https://unpkg.com/jieba-wasm@${__JIEBA_VERSION__}/pkg/web/jieba_rs_wasm_bg.wasm`;

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
      div.appendText(
        "结巴分词组件保存在 IndexedDB，同源库可共享，请下载或导入组件：",
      );
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          this.downloadButton = li.createEl(
            "button",
            { text: "自动下载" },
            (btn) =>
              (btn.onclick = () => {
                void this.onDownloadingFile();
              }),
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
                (btn) =>
                  (btn.onclick = () => {
                    void this.onSelectingFile();
                  }),
              );
            });
          });
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }

  private async install(binary: () => Promise<ArrayBuffer>) {
    this.selectButton?.setAttribute("disabled", "");
    this.downloadButton?.setAttribute("disabled", "");
    try {
      await this.plugin.installJieba(await binary());
      new Notice("安装成功，已启用结巴分词");
      this.close();
    } catch (error) {
      console.error("Failed to install jieba wasm", error);
      new Notice("结巴分词组件安装失败，请检查网络或选择有效的 WASM 文件");
    } finally {
      this.selectButton?.removeAttribute("disabled");
      this.downloadButton?.removeAttribute("disabled");
    }
  }

  async onSelectingFile() {
    const file = await pickFile(".wasm");
    if (file) await this.install(() => file.arrayBuffer());
  }

  async onDownloadingFile() {
    await this.install(async () => {
      const response = await requestUrl(wasmUrl);
      if (response.status !== 200)
        throw new Error(`Download failed: ${response.status}`);
      return response.arrayBuffer;
    });
  }
}
