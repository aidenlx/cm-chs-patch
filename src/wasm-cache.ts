import { openDB, type DBSchema } from "idb";

interface WasmCache extends DBSchema {
  binaries: {
    key: string;
    value: ArrayBuffer;
  };
}

// A fixed database name allows vaults on the same Obsidian origin to reuse it.
const databaseName = "cm-chs-patch-jieba";
const binaryKey = `jieba-wasm@${__JIEBA_VERSION__}`;

async function openCache() {
  return openDB<WasmCache>(databaseName, 1, {
    upgrade(db) {
      db.createObjectStore("binaries");
    },
  });
}

export async function loadWasm(): Promise<ArrayBuffer | null> {
  const db = await openCache();
  try {
    return (await db.get("binaries", binaryKey)) ?? null;
  } finally {
    db.close();
  }
}

export async function saveWasm(binary: ArrayBuffer): Promise<void> {
  if (!WebAssembly.validate(binary)) {
    throw new Error("The selected file is not a valid WebAssembly binary.");
  }
  const db = await openCache();
  try {
    await db.put("binaries", binary, binaryKey);
  } finally {
    db.close();
  }
}

export async function listWasmVersions(): Promise<string[]> {
  const db = await openCache();
  try {
    return await db.getAllKeys("binaries");
  } finally {
    db.close();
  }
}

export async function deleteWasm(key = binaryKey): Promise<boolean> {
  const db = await openCache();
  try {
    const tx = db.transaction("binaries", "readwrite");
    const exists = (await tx.store.count(key)) > 0;
    await tx.store.delete(key);
    await tx.done;
    return exists;
  } finally {
    db.close();
  }
}
