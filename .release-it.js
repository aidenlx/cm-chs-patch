export default {
  hooks: {
    // "before:init": ["npm run eslint"],
    "after:bump": ["pnpm build", "git add ."],
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
    "./scripts/ob-bumper.js": {
      indent: 2,
    },
  },
  npm: {
    publish: false,
  },
  github: {
    // GitHub release is created by .github/workflows/release.yml on tag push.
    release: false,
  },
};
