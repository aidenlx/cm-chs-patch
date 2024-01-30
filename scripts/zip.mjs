import { createReadStream, createWriteStream, existsSync } from "fs";
import JSZip from "jszip";
import { join } from "path";
import { pipeline } from "stream/promises";
const assets = ["main.js", "styles.css", "manifest.json"];
const zip = new JSZip();
for (const filename of assets) {
  const filepath = join("build", filename);
  const exists = existsSync(filepath);
  if (!exists) {
    if (filename === "styles.css") continue;
    throw new Error(`File ${filepath} does not exist.`);
  }
  zip.file(filename, createReadStream(filepath));
}
await pipeline(
  zip.generateNodeStream({ type: "nodebuffer", streamFiles: true }),
  createWriteStream(join("build", "zotlit.zip")),
);
console.log("zotlit.zip written.");
