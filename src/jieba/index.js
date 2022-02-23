/* eslint-disable prefer-arrow/prefer-arrow-functions */
// from https://github.com/napi-rs/node-rs/tree/%40node-rs/jieba%401.6.0/packages/jieba

const { join } = require("path");
const { libName, getConfigDirFunc } = require("../const");
const { default: showInstallGuide } = require("../install-guide");

const { platform, arch } = process;

let nativeBinding = null;
let loadError = null;

// if platform is supported
if (libName) {
  try {
    nativeBinding = require(join(getConfigDirFunc(), libName));
  } catch (e) {
    if (e?.code === "MODULE_NOT_FOUND") {
      showInstallGuide();
    }
    loadError = e;
  }
} else {
  throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}

if (!nativeBinding) {
  if (loadError) {
    throw loadError;
  }
  throw new Error(`Failed to load native binding`);
}

Object.assign(module.exports, nativeBinding);
