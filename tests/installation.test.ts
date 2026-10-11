import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("installation preserves an engine selection made while settings are saving", async () => {
  const source = await readFile(
    new URL("../src/chsp-main.ts", import.meta.url),
    "utf8",
  );
  const module = { exports: {} };
  const imports = {
    obsidian: { Plugin: class {} },
    "./chsp-vim.js": {},
    "./cm6": {},
    "./install-guide": {},
    "./jieba": { initJieba: async () => {}, cut: () => ["jieba"] },
    "./settings": {},
    "./utils.js": {},
    "./wasm-cache": {},
  };
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name: keyof typeof imports) => {
        assert.ok(name in imports, `Unexpected import: ${name}`);
        return imports[name];
      },
      Intl,
      window: { Intl },
    },
  );
  const plugin = Object.create(module.exports.default.prototype);
  const saving = Promise.withResolvers<void>();
  const startedSaving = Promise.withResolvers<void>();
  let patchesEnabled = 0;
  Object.assign(plugin, {
    settings: { useJieba: false, dict: "" },
    segmenter: new Intl.Segmenter("zh-CN", { granularity: "word" }),
    saveLib: async () => {},
    saveData: () => {
      startedSaving.resolve();
      return saving.promise;
    },
    enablePatches: () => patchesEnabled++,
  });

  const installation = plugin.installJieba(new ArrayBuffer(0));
  await startedSaving.promise;
  assert.equal(plugin.settings.useJieba, true);
  const activatedBeforeSave = plugin.segmenter === undefined;
  const patchesBeforeSave = patchesEnabled;

  plugin.settings.useJieba = false;
  await plugin.applySegmenter();
  const nativeSegmenter = plugin.segmenter;
  assert.ok(nativeSegmenter instanceof Intl.Segmenter);
  saving.resolve();
  await installation;

  assert.equal(plugin.settings.useJieba, false);
  assert.equal(plugin.segmenter, nativeSegmenter);
  assert.deepEqual(Array.from(plugin.cut("中文分词")), ["中文", "分词"]);
  assert.equal(activatedBeforeSave, true);
  assert.equal(patchesBeforeSave, 1);
});
