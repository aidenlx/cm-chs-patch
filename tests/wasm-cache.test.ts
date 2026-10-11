import "fake-indexeddb/auto";
import { openDB } from "idb";
import assert from "node:assert/strict";
import { test } from "node:test";

globalThis.__JIEBA_VERSION__ = "test";
const { loadWasm, saveWasm, deleteWasm, listWasmVersions } =
  await import("../src/wasm-cache.ts");
const wasm = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]).buffer;

test("versioned cache persists across connections and preserves other versions", async () => {
  assert.equal(await loadWasm(), null);
  assert.equal(await deleteWasm(), false);
  await saveWasm(wasm);
  assert.deepEqual(await loadWasm(), wasm);

  const otherVault = await openDB("cm-chs-patch-jieba", 1);
  assert.deepEqual(await otherVault.get("binaries", "jieba-wasm@test"), wasm);
  await otherVault.put("binaries", wasm, "jieba-wasm@other-version");
  otherVault.close();
  assert.deepEqual((await listWasmVersions()).sort(), [
    "jieba-wasm@other-version",
    "jieba-wasm@test",
  ]);

  await assert.rejects(saveWasm(new Uint8Array([1, 2, 3]).buffer));
  assert.deepEqual(await loadWasm(), wasm);
  assert.equal(await deleteWasm(), true);
  assert.equal(await loadWasm(), null);
  const reopened = await openDB("cm-chs-patch-jieba", 1);
  assert.deepEqual(
    await reopened.get("binaries", "jieba-wasm@other-version"),
    wasm,
  );
  reopened.close();
  assert.equal(await deleteWasm("jieba-wasm@other-version"), true);
  assert.deepEqual(await listWasmVersions(), []);
});
