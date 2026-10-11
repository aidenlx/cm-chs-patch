import { build } from "vite";
import { once } from "node:events";

const built = await build({
  configFile: false,
  logLevel: "error",
  build: {
    write: false,
    minify: false,
    lib: {
      entry: "tests/double-click.ts",
      name: "DoubleClickTests",
      formats: ["iife"],
    },
  },
});
const code = built[0].output.find((file) => file.type === "chunk").code;
const endpoint = process.env.OBSIDIAN_CDP_URL ?? "http://127.0.0.1:9222";
const targets = await (await fetch(`${endpoint}/json/list`)).json();
const pages = targets.filter(
  (target) =>
    target.url === "app://obsidian.md/index.html" &&
    target.title.includes("Obsidian 1.14.4"),
);
let tested = false;
for (const page of pages) {
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await once(socket, "open");
  let id = 0;
  const evaluate = (expression) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        socket.removeEventListener("message", receive);
        reject(new Error("CDP evaluation timed out"));
      }, 15000);
      function receive(event) {
        const message = JSON.parse(event.data);
        if (message.id !== requestId) return;
        clearTimeout(timer);
        socket.removeEventListener("message", receive);
        if (message.error || message.result.exceptionDetails)
          reject(
            new Error(
              JSON.stringify(message.error ?? message.result.exceptionDetails),
            ),
          );
        else resolve(message.result.result.value);
      }
      socket.addEventListener("message", receive);
      socket.send(
        JSON.stringify({
          id: requestId,
          method: "Runtime.evaluate",
          params: { expression, returnByValue: true, awaitPromise: true },
        }),
      );
    });
  try {
    const ready = await evaluate('!!document.querySelector(".cm-content")');
    if (!ready) continue;
    const results = await evaluate(
      `(()=>{${code}\nreturn DoubleClickTests.run()})()`,
    );
    for (const result of results) console.log(`PASS ${result}`);
    tested = true;
    break;
  } finally {
    socket.close();
  }
}
if (!tested)
  throw new Error(
    "Open a note in Obsidian 1.14.4 with remote debugging enabled",
  );
