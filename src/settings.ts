import {
  debounce,
  Notice,
  PluginSettingTab,
  Setting,
  SettingGroup,
} from "obsidian";
import type CMChsPatch from "./chsp-main";
import GoToDownloadModal from "./install-guide";

type TextAreaSize = Partial<Record<"cols" | "rows", number>>;

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

type SettingKeyWithType<T> = {
  [K in keyof ChsPatchSetting]: ChsPatchSetting[K] extends T ? K : never;
}[keyof ChsPatchSetting];

export class ChsPatchSettingTab extends PluginSettingTab {
  private displayVersion = 0;

  constructor(public plugin: CMChsPatch) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const displayVersion = ++this.displayVersion;

    containerEl.empty();

    const jiebaGroup = new SettingGroup(containerEl).setHeading("结巴分词");

    jiebaGroup.addSetting((setting) =>
      this.bindToggle(setting, "useJieba")
        .setName("使用结巴分词")
        .setDesc("支持新词发现、自定义词典，需要额外下载，重启 Obsidian 生效"),
    );

    this.plugin
      .libExists()
      .then((isInstalled) => {
        if (displayVersion !== this.displayVersion || !isInstalled) return;
        jiebaGroup.addSetting((setting) => this.bindDeleteLib(setting));
      })
      .catch((e) => {
        console.error("Failed to check jieba wasm binary", e);
      });

    if (this.plugin.settings.useJieba || !(window.Intl as any)?.Segmenter) {
      jiebaGroup.addSetting((setting) =>
        this.bindToggle(setting, "hmm")
          .setName("新词发现功能")
          .setDesc(
            "采用基于汉字成词能力的 HMM 模型，使用 Viterbi 算法推算未存在于词库内的词。若效果不理想，可选择关闭此选项",
          ),
      );
      // TODO: 增加添加词的界面、导入词库文件
      jiebaGroup.addSetting((setting) =>
        this.bindTextArea(
          setting,
          { get: "dict", set: "dict" },
          { cols: 30, rows: 5 },
        )
          .setName("用户自定义词典")
          .setDesc(
            createFragment((el) => {
              el.appendText("通过用户自定义词典来增强歧义纠错能力");
              el.createEl("br");
              el.appendText(
                "词典格式：一个词占一行；每一行分三部分：词语、词频（可省略）、词性（可省略），用空格隔开，顺序不可颠倒",
              );
              el.createEl("br");
              el.appendText("重启 Obsidian 后生效");
            }),
          ),
      );
    }

    if (
      (this.plugin.settings.useJieba || (window.Intl as any)?.Segmenter) &&
      this.plugin.app.vault.getConfig("vimMode") === true
    ) {
      const vimGroup = new SettingGroup(containerEl).setHeading("Vim Mode");

      vimGroup.addSetting((setting) =>
        this.bindToggle(setting, "moveByChineseWords")
          .setName("使用结巴分词移动光标")
          .setDesc(
            "Motion w/e/b/ge 使用结巴分词移动光标 in Vim Normal Mode, 重启Obsidian生效",
          ),
      );

      vimGroup.addSetting((setting) =>
        this.bindToggle(setting, "moveTillChinesePunctuation")
          .setName("f/t<character> 支持输入英文标点跳转到中文标点")
          .setDesc(
            "Motion f/t<character> 支持输入英文标点跳转到中文标点 in Vim Normal Mode, 重启Obsidian生效",
          ),
      );
    }
  }

  private bindDeleteLib(setting: Setting): Setting {
    return setting
      .setName("删除结巴分词组件")
      .setDesc(
        createFragment((el) => {
          el.appendText("删除已下载的 ");
          el.createEl("code", { text: this.plugin.libName });
          el.appendText("，重启 Obsidian 后生效");
        }),
      )
      .addButton((btn) =>
        btn
          .setButtonText("删除")
          .setWarning()
          .onClick(async () => {
            btn.setDisabled(true);
            try {
              const deleted = await this.plugin.deleteLib();
              new Notice(
                deleted
                  ? "✔️ 已删除结巴分词组件，请重启 Obsidian"
                  : "未找到结巴分词组件",
              );
              this.display();
            } catch (e) {
              console.error("Failed to delete jieba wasm binary", e);
              new Notice("❌ 删除结巴分词组件失败，详情请查看控制台");
              btn.setDisabled(false);
            }
          }),
      );
  }

  private bindToggle(
    setting: Setting,
    key: SettingKeyWithType<boolean>,
  ): Setting {
    return setting.addToggle((toggle) => {
      toggle.setValue(this.plugin.settings[key]).onChange((value) => {
        this.plugin.settings[key] = value;
        this.plugin.saveSettings();
        if (key === "useJieba") {
          this.plugin.libExists().then((isExisted) => {
            if (!isExisted && value === true)
              new GoToDownloadModal(this.plugin).open();
          });
          this.display();
        }
      });
    });
  }

  private bindTextArea(
    setting: Setting,
    key: {
      get: SettingKeyWithType<string> | (() => string);
      set: SettingKeyWithType<string> | ((value: string) => void);
    },
    size: TextAreaSize = {},
    timeout = 500,
  ): Setting {
    return setting.addTextArea((text) => {
      const { get, set } = key;
      const getter =
          typeof get === "function" ? get : () => this.plugin.settings[get],
        setter =
          typeof set === "function"
            ? set
            : (value: string) => (this.plugin.settings[set] = value);
      const onChange = async (value: string) => {
        setter(value);
        await this.plugin.saveSettings();
      };
      text.setValue(getter()).onChange(debounce(onChange, timeout, true));
      Object.assign(text.inputEl, { cols: 30, rows: 5, ...size });
    });
  }
}
