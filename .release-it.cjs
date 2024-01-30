module.exports = {
  hooks: {
    // "before:init": ["npm run eslint"],
    "after:bump": [
      "pnpm build",
      "node ./scripts/zip.mjs",
      "git add .",
    ],
    "after:release":
      "echo Successfully released obsidian plugin ${name} v${version} to ${repo.repository}.",
  },
  git: {
    commitMessage: "chore: release obsidian plugin v${version}",
    tagName: "${version}",
    tagAnnotation: "Release Obsidian Plugin v${version}",
    addUntrackedFiles: true,
  },
  plugins: {
    // "@release-it/conventional-changelog": {
    //   preset: "angular",
    //   infile: "CHANGELOG.md",
    // },
    "./scripts/ob-bumper.mjs": {
      indent: 2,
    },
  },
  npm: {
    publish: false,
  },
  github: {
    release: true,
    assets: [
      "build/main.js",
      "build/manifest.json",
      "build/styles.css",
      "build/zotlit.zip",
    ],
    proxy: process.env.HTTPS_PROXY,
    releaseName: "${version}",
  },
};
