# Word Splitting for Simplified Chinese in Edit Mode

A patch for Obsidian's built-in CodeMirror Editor to support Simplified Chinese word splitting

增加 Obsidian 内置编辑器的(简体)中文分词支持，使得编辑模式的双击可以选中中文

Special Thanks to [@linonetwo](https://github.com/linonetwo) for [the chs word splitting module](https://github.com/linonetwo/segmentit)

## Demo

| Obsidian's Default Word Splitting<br>默认分词 | Patched<br>安装插件后 |
| ------------------ | ----------- |
| ![ob-default-splitting](https://img.aidenlx.top/img/ob-default-splitting.gif)                   | ![ob-patched-splitting](https://img.aidenlx.top/img/ob-patched-splitting.gif)            |

## Compatibility 兼容性

The required API feature is only available for Obsidian v0.10.0+.

本插件仅支持0.10.0以上的版本

## Installation 安装

### From Obsidian

1. Open `Settings` > `Third-party plugin`
2. Make sure Safe mode is **off**
3. Click `Browse community plugins`
4. Search for this plugin
5. Click `Install`
6. Once installed, close the community plugins window and the patch is ready to use.

***

1. 打开`设置`>`第三方插件`
2. 确保安全模式为`关闭`
3. 点击`浏览社区插件`
4. 搜索此插件
5. 点击`安装`
6. 安装完成后，关闭安装窗口，插件即可使用

### From GitHub

1. Download the Latest Release from the Releases section of the GitHub Repository
2. Put files to your vault's plugins folder: `<vault>/.obsidian/plugins/cm-chs-patch`  
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.
Otherwise head to Settings, third-party plugins, make sure safe mode is off and
enable the plugin from there.

> Note: The `.obsidian` folder may be hidden. On macOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.

***

1. 从GitHub仓库的Releases下载最新版本
2. 把文件放在对应Vault的插件文件夹下：`<vault>/.obsidian/plugins/cm-chs-patch`
3. 重新加载Obsidian
4. 如果出现有关安全模式的提示，则可以禁用安全模式并启用插件。否则，请转到`设置`→`第三方插件`，确保关闭安全模式，然后从`第三方插件`启用插件

> 注意，`.obsidian`文件夹为隐藏文件夹，在macOS的Finder下可以按`Command+Shift+.`以显示隐藏文件夹
