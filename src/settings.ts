import {
  Notice,
  PluginSettingTab,
  type SettingDefinitionItem,
  type SettingDefinitionRender,
} from "obsidian";
import type CMChsPatch from "./chsp-main";
import GoToDownloadModal from "./install-guide";
import { listWasmVersions, deleteWasm } from "./wasm-cache";
import { listLegacyCaches, type LegacyCacheFile } from "./legacy-cache";

export interface ChsPatchSetting {
  useJieba: boolean;
  hmm: boolean;
  dict: string;
  moveByChineseWords: boolean;
  moveTillChinesePunctuation: boolean;
}

export const DEFAULT_SETTINGS: ChsPatchSetting = {
  useJieba: false,
  hmm: false,
  dict: "",
  moveByChineseWords: true,
  moveTillChinesePunctuation: true,
};

export class ChsPatchSettingTab extends PluginSettingTab {
  private cachedVersions: string[] = [];
  private legacyFiles: LegacyCacheFile[] = [];
  private cacheStatus = "点击刷新以查看缓存";

  private async refreshCaches() {
    const [versions, legacy] = await Promise.allSettled([
      listWasmVersions(),
      listLegacyCaches(this.app),
    ]);
    this.cachedVersions = versions.status === "fulfilled" ? versions.value : [];
    this.legacyFiles = legacy.status === "fulfilled" ? legacy.value : [];
    const errors = [versions, legacy].filter(
      (result) => result.status === "rejected",
    );
    this.cacheStatus = errors.length
      ? "部分缓存无法读取，请查看控制台"
      : "缓存列表已更新";
    for (const error of errors) {
      if (error.status === "rejected")
        console.error("Failed to list jieba caches", error.reason);
    }
    this.update();
  }

  private cacheEntry(
    name: string,
    desc: string,
    remove: () => Promise<unknown>,
  ): SettingDefinitionRender {
    return {
      name,
      desc,
      searchable: false,
      render: (setting) => {
        setting.addButton((btn) =>
          btn
            .setButtonText("删除")
            .setDestructive()
            .onClick(() => {
              btn.buttonEl.blur();
              btn.setDisabled(true);
              void remove()
                .then(() => {
                  btn.setButtonText("已删除");
                  new Notice(
                    "已删除缓存，点击刷新查看缓存列表，重启 Obsidian 后生效",
                  );
                })
                .catch((error: unknown) => {
                  console.error("Failed to delete jieba cache", error);
                  new Notice("删除缓存失败，请刷新列表后重试");
                  btn.setDisabled(false);
                });
            }),
        );
      },
    };
  }

  constructor(public plugin: CMChsPatch) {
    super(plugin.app, plugin);
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    await super.setControlValue(key, value);
    this.refreshDomState();
    if (key === "useJieba" && value === true) {
      try {
        if (!(await this.plugin.libExists()))
          new GoToDownloadModal(this.plugin).open();
      } catch (error) {
        console.error("Failed to check jieba cache", error);
        new Notice("无法读取结巴分词缓存，请尝试重新导入组件");
      }
    }
  }

  getSettingDefinitions(): SettingDefinitionItem<keyof ChsPatchSetting>[] {
    const usesJieba = () =>
      this.plugin.settings.useJieba || !window.Intl?.Segmenter;
    return [
      {
        type: "group",
        heading: "结巴分词",
        items: [
          {
            name: "使用结巴分词",
            desc: "支持新词发现、自定义词典，需要额外下载，重启 Obsidian 生效",
            control: { type: "toggle", key: "useJieba" },
          },
          {
            name: "安装或导入结巴分词组件",
            desc: "自动下载或选择本地 WASM 文件，缓存保存在 IndexedDB，同源库可共享",
            action: () => new GoToDownloadModal(this.plugin).open(),
          },
          {
            type: "page",
            name: "管理结巴分词缓存",
            desc: "手动删除旧文件缓存或任意 IndexedDB 缓存版本，共享缓存删除会影响所有同源库",
            items: [
              {
                name: "刷新缓存列表",
                desc: this.cacheStatus,
                action: (el) => {
                  el.blur();
                  void this.refreshCaches();
                },
              },
              {
                type: "group",
                heading: "IndexedDB 缓存版本",
                items: this.cachedVersions.length
                  ? this.cachedVersions.map((key) =>
                      this.cacheEntry(key, "同源库共享此缓存", () =>
                        deleteWasm(key),
                      ),
                    )
                  : [{ name: "未找到 IndexedDB 缓存" }],
              },
              {
                type: "group",
                heading: "旧文件系统缓存",
                items: this.legacyFiles.length
                  ? this.legacyFiles.map((file) =>
                      this.cacheEntry(file.name, file.location, () =>
                        file.remove(),
                      ),
                    )
                  : [{ name: "未找到旧文件缓存" }],
              },
            ],
          },
          {
            name: "新词发现功能",
            desc: "使用 HMM 模型推算词库之外的新词，若效果不理想可关闭",
            visible: usesJieba,
            control: { type: "toggle", key: "hmm" },
          },
          {
            type: "page",
            name: "用户自定义词典",
            desc: "通过自定义词典增强歧义纠错能力，重启 Obsidian 后生效",
            visible: usesJieba,
            items: [
              {
                name: "词典内容",
                desc: "每行一个词：词语、可选词频、可选词性，按顺序用空格隔开",
                control: { type: "textarea", key: "dict", rows: 8 },
              },
            ],
          },
        ],
      },
      {
        type: "group",
        heading: "Vim 模式",
        items: [
          {
            name: "按中文词语移动光标",
            desc: "Vim 普通模式下 w/e/b/ge 按中文分词移动，重启 Obsidian 后生效",
            control: { type: "toggle", key: "moveByChineseWords" },
          },
          {
            name: "使用英文标点查找中文标点",
            desc: "Vim 普通模式下 f/t 支持对应中文标点，重启 Obsidian 后生效",
            control: { type: "toggle", key: "moveTillChinesePunctuation" },
          },
        ],
      },
    ];
  }
}
