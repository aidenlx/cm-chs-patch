const PlatformSupported = [
  ["darwin", "arm64"],
  ["darwin", "x64"],
  ["linux", "x64"],
  ["linux", "arm64"],
  ["win32", "x64"],
  ["win32", "ia32"],
  ["win32", "arm64"],
];
const { platform, arch } = process;

/**
 * @returns {string}
 */
module.exports.getConfigDirFunc = () =>
  app.vault.adapter.getFullPath(app.vault.configDir);
module.exports.getConfigDirExec = `app.vault.adapter.getFullPath(app.vault.configDir)`;

const getLibName = () => {
  if (PlatformSupported.some(([p, a]) => arch === a && platform === p)) {
    let moduleName = `jieba.${platform}-${arch}`;
    if (platform === "win32") {
      moduleName += "-msvc";
    } else if (platform === "linux") {
      if (!process.report.getReport().header?.glibcVersionRuntime)
        moduleName += "-msvl";
      else moduleName += "-gnu";
    }
    return moduleName + ".node";
  } else {
    return null;
  }
};

/**
 * @type {string|null}
 */
module.exports.libName = getLibName();
