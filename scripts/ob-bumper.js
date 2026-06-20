import { promises } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join } from "node:path";
const { readFile, writeFile } = promises;
import { Plugin } from "release-it";
import semverPrerelease from "semver/functions/prerelease.js";

const mainManifest = "manifest.json",
  versionsList = "versions.json";
const targets = [mainManifest, versionsList];

const isPreRelease = (version) => semverPrerelease(version) !== null;

class ObsidianVersionBump extends Plugin {
  async readJson(path) {
    try {
      const result = JSON.parse(await readFile(path, "utf8"));
      return result;
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
  async writeJson(file, data) {
    const { indent = 4 } = this.getContext();
    await writeFile(file, JSON.stringify(data, null, indent));
  }

  async readManifest() {
    const { isDryRun } = this.config;
    this.log.exec(`Reading manifest from ${mainManifest}`, isDryRun);
    const manifest = await this.readJson(mainManifest);
    if (!manifest) throw new Error("Missing manifest data");
    return manifest;
  }

  /**
   * Only stable releases touch manifest.json so that `main` always reflects the
   * latest stable version. Pre-release versions are carried by package.json
   * (bumped by release-it) and stamped onto the build output by vite, so BRAT
   * resolves them straight from the GitHub pre-release.
   */
  async writeManifest(targetVersion, manifest) {
    if (isPreRelease(targetVersion)) return;
    const { isDryRun } = this.config;
    const updatedMainfest = { ...manifest, version: targetVersion };
    if (!isDryRun) await this.writeJson(mainManifest, updatedMainfest);
    this.log.exec(
      `Wrote version ${targetVersion} to ${mainManifest}`,
      isDryRun,
    );
  }

  async copyToRoot() {
    const { copyTo } = this.getContext();
    if (!copyTo) return;
    const { isDryRun } = this.config;
    if (!isDryRun) {
      await Promise.all(
        targets.map((file) =>
          copyFile(file, join(copyTo, file)).catch((err) => {
            if (err.code !== "ENOENT") throw err;
          }),
        ),
      );
    }
    this.log.exec(`Copied ${targets.join(", ")} to ${copyTo}`, isDryRun);
  }

  /**
   * update versions.json with target version and minAppVersion from manifest.json.
   * pre-releases are skipped — versions.json feeds the Obsidian community store,
   * which only cares about stable versions.
   */
  async writeVersion(targetVersion, { minAppVersion }) {
    if (isPreRelease(targetVersion)) return;
    const { isDryRun } = this.config;
    const versions = await this.readJson(versionsList);
    versions[targetVersion] = minAppVersion;
    if (!isDryRun) await this.writeJson(versionsList, versions);
    this.log.exec(
      `Wrote version ${targetVersion} to ${versionsList}`,
      isDryRun,
    );
  }

  async bump(targetVersion) {
    // read minAppVersion from manifest and bump version to target version
    const manifest = await this.readManifest(targetVersion);
    this.log.info(`min obsidian app version: ${manifest.minAppVersion}`);
    await Promise.all([
      this.writeManifest(targetVersion, manifest),
      this.writeVersion(targetVersion, manifest),
    ]);
    await this.copyToRoot();
  }
}
export default ObsidianVersionBump;
