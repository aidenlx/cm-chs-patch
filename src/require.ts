export function requireFs() {
	return require("node:fs/promises") as typeof import("node:fs/promises");
}
export function requireElectronRemote() {
	return require("@electron/remote") as typeof import("@electron/remote");
}
export function requirePath() {
	return require("node:path") as typeof import("node:path");
}