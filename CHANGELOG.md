

# [1.9.0](https://github.com/aidenlx/cm-chs-patch/compare/1.8.2...1.9.0) (2023-01-14)


### Bug Fixes

* display vim mode settings only if vimMode is enabled ([2f9e9ad](https://github.com/aidenlx/cm-chs-patch/commit/2f9e9ad9c112c94f0c966532642afadfbbef4613))
* fix English word truncated out of RANGE_LIMIT [#14](https://github.com/aidenlx/cm-chs-patch/issues/14) ([6794478](https://github.com/aidenlx/cm-chs-patch/commit/6794478311a419778d11a37ff11ad72c865d4554))
* refresh settings if useJieba toggled ([2eaa113](https://github.com/aidenlx/cm-chs-patch/commit/2eaa113807a4d24d3e7244304c3bcc84a495586a))
* Vim mode toggle is available even if useJieba is false ([a220965](https://github.com/aidenlx/cm-chs-patch/commit/a2209658af95edf76cfc80fd1046379656f06513))


### Features

* support background download jieba-wasm file from GitHub ([94511a5](https://github.com/aidenlx/cm-chs-patch/commit/94511a522cec38ee6e2d4bce0c2525da1584d3c3))
* support moveByWords and moveTillChinesePunctuation in Vim normal mode [#4](https://github.com/aidenlx/cm-chs-patch/issues/4) ([2cbfdf6](https://github.com/aidenlx/cm-chs-patch/commit/2cbfdf6139d416860ba758b8aaba52da848a693d))


### Performance Improvements

* auto download from cdn directly, remove unzipit to reduce bundle size ([05736e9](https://github.com/aidenlx/cm-chs-patch/commit/05736e9713560733bf949c7fccd3bb9029243c83))

## [1.8.2](https://github.com/aidenlx/cm-chs-patch/compare/1.8.1...1.8.2) (2022-10-08)


### Bug Fixes

* should be compatable with codemirror v6 now ([1fba3bf](https://github.com/aidenlx/cm-chs-patch/commit/1fba3bf8deb35431e5f3d96ac6c92e770312eb3a)), closes [#15](https://github.com/aidenlx/cm-chs-patch/issues/15)

## [1.8.1](https://github.com/aidenlx/cm-chs-patch/compare/1.8.0...1.8.1) (2022-05-02)


### Bug Fixes

* fix no chs word selected when cursor at end of line ([482f0b9](https://github.com/aidenlx/cm-chs-patch/commit/482f0b97def4a3ac71e5d60f009c490ceefbf6de))

# [1.8.0](https://github.com/aidenlx/cm-chs-patch/compare/1.7.0...1.8.0) (2022-04-29)


### Features

* support native segmenter ([d642bf3](https://github.com/aidenlx/cm-chs-patch/commit/d642bf3c6114be5365728ada1da10b7940fd41ec))

# [1.7.0](https://github.com/aidenlx/cm-chs-patch/compare/1.6.0...1.7.0) (2022-04-28)


### Features

* support keyboard delete by chinese word ([7b9631c](https://github.com/aidenlx/cm-chs-patch/commit/7b9631c834c9b19159067c051d934b12a2d469ea)), closes [#2](https://github.com/aidenlx/cm-chs-patch/issues/2)

# [1.6.0](https://github.com/aidenlx/cm-chs-patch/compare/1.5.0...1.6.0) (2022-04-28)


### Features

* support navigate by chinese word ([3d33660](https://github.com/aidenlx/cm-chs-patch/commit/3d33660ac71a868f0927a1775e397f1a4b2e6860)), closes [#2](https://github.com/aidenlx/cm-chs-patch/issues/2)

# [1.5.0](https://github.com/aidenlx/cm-chs-patch/compare/1.4.1...1.5.0) (2022-02-24)


### Features

* add button to reload user dict ([6ff2d44](https://github.com/aidenlx/cm-chs-patch/commit/6ff2d441678a25865423891ec4a32069c4e01959))
* add hmm option, add user dict ([f6c6299](https://github.com/aidenlx/cm-chs-patch/commit/f6c6299edcb0676fb200ab6c8bb98b2e7dbcc7a1))
* add 蓝奏云 download link ([eb4bdeb](https://github.com/aidenlx/cm-chs-patch/commit/eb4bdebcbfa7cbb58729230ddd095e1a1a3e355c))
* migrate to @node-rs/jieba ([801621f](https://github.com/aidenlx/cm-chs-patch/commit/801621f6354b6ddc920cdbc5586deaf155445e7b))
* migrate to jieba-wasm; enable mobile flag ([338245d](https://github.com/aidenlx/cm-chs-patch/commit/338245d7ce80509c5d6a5983ed4199a742114fc7))


### Reverts

* downgrade esbuild to support stable version of obsidian ([7dfc4bd](https://github.com/aidenlx/cm-chs-patch/commit/7dfc4bd14970e65e440bf5606c8488c53a479999))
* remove api ([4144b91](https://github.com/aidenlx/cm-chs-patch/commit/4144b91cb7cbae824c3a3ec0193ac324b40851fa))

## [1.4.1](https://github.com/aidenlx/cm-chs-patch/compare/1.4.0...1.4.1) (2021-12-13)


### Features

* patch EditorState.wordAt ([2eec604](https://github.com/aidenlx/cm-chs-patch/commit/2eec6043e388e8462b6bf485f630f1e19d1fc6e7))

# [1.4.0](https://github.com/aidenlx/cm-chs-patch/compare/1.3.1...1.4.0) (2021-12-13)


### Features

* support live preview (cm6) ([a809e2c](https://github.com/aidenlx/cm-chs-patch/commit/a809e2cd525a6bb841da5cdaaaf48a79130c4d0a))

## [1.3.1](https://github.com/aidenlx/cm-chs-patch/compare/1.3.0...1.3.1) (2021-09-03)


### Bug Fixes

* fix dependencies; fix api not loaded ([795bb33](https://github.com/aidenlx/cm-chs-patch/commit/795bb33764bd9543eccab15ed771f8bace4e56a5))

# [1.3.0](https://github.com/aidenlx/cm-chs-patch/compare/1.2.0...1.3.0) (2021-09-03)


### Features

* **api:** add regex for chinese; update pinyinlite option def ([639a61f](https://github.com/aidenlx/cm-chs-patch/commit/639a61f5776ee73c92722bb5972ae4a40d781625))

# [1.2.0](https://github.com/aidenlx/cm-chs-patch/compare/1.1.0...1.2.0) (2021-09-03)


### Features

* add api for pinyin parse ([5b861cc](https://github.com/aidenlx/cm-chs-patch/commit/5b861cc686332bb30d55897c5e1fec2feff3bde5))



# [1.1.0](https://github.com/aidenlx/cm-chs-patch/compare/1.1.0...1.2.0) (2021-04-06)



# [1.1.0](https://github.com/aidenlx/cm-chs-patch/compare/1.1.0...1.2.0) (2021-04-06)



# [1.0.0](https://github.com/aidenlx/cm-chs-patch/compare/1.1.0...1.2.0) (2021-04-02)