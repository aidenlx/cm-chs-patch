import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { cut, initJieba } from "../src/jieba.ts";

test("jieba initializes immediately, shares concurrent initialization, and retries failures", async () => {
  await assert.rejects(initJieba(new Uint8Array([1, 2, 3]).buffer));
  const bytes = await readFile(
    new URL(
      "../node_modules/jieba-wasm/pkg/web/jieba_rs_wasm_bg.wasm",
      import.meta.url,
    ),
  );
  const binary = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  const first = initJieba(binary, "中文分词测试 100000 n");
  const second = initJieba(binary, "中文分词测试 100000 n");
  assert.equal(first, second);
  await first;
  assert.deepEqual(cut("中文分词测试"), ["中文分词测试"]);
  assert.deepEqual(cut("南京市长江大桥"), ["南京市", "长江大桥"]);
});
