# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

An Obsidian plugin for Brewlang, the `.brew` coffee recipe language: it shows every ```` ```brew ```` code block of a note as a recipe card. All language logic lives in the `brewlang` monorepo next to this repo (`../brewlang`): the language (`packages/brewlang`) and the card (`packages/render`, `@brewlang/render`). The plugin only displays what they return.

## Commands

- `npm test` — Vitest: `tests/block.test.ts`
- `npm run build` — `tsc --noEmit`, then esbuild: `main.js` (brewlang and @brewlang/render bundled in, `obsidian` external) and `styles.css`
- `npm run dev` — esbuild in watch mode, with inline source maps

## Dependency on brewlang

`"brewlang"` and `"@brewlang/render"` are `file:` links to `../brewlang/packages/*`, resolved through their `dist/`: run `npm run build` in `../brewlang` after changing it. They are bundled into `main.js`, since the packages are not on npm yet.

## Code

- `src/block.ts` — `renderBlock(source)`: `render()` from @brewlang/render, and the diagnostics as `Line n: message`, numbered from the block's first line. Pure, so it is what the tests cover.
- `src/main.ts` — the plugin: `registerMarkdownCodeBlockProcessor("brew", …)` puts the card in the block with `sanitizeHTMLToDom` (never `innerHTML`, per Obsidian's plugin guidelines; the HTML is escaped anyway) and lists the problems under it.
- `src/styles.css` — maps the card's `--brew-*` variables onto the Obsidian theme (`--background-primary`, `--text-normal`, `--font-text`…); `.theme-dark` gets brew.css's dark accent and qualifier colors. `esbuild.config.mjs` writes `styles.css` as brew.css followed by this file.
- `main.js` and `styles.css` are build outputs, ignored by git; releases attach them.

## Releases

`manifest.json` (`id: brewlang`, `version`, `minAppVersion`), `package.json` and `versions.json` (version → minimum Obsidian version) change together. Pushing a tag named exactly like the version (`0.1.0`, no `v`) runs `.github/workflows/release.yml`, which checks the tag against the manifest and publishes a release with `main.js`, `manifest.json` and `styles.css`. `ci.yml` tests and builds pull requests and `main`, with brewlang checked out next to the plugin.

## Conventions

Same as `../brewlang`: strict TS with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, `import type` for types, 2-space indent, `///` comments on internal members and `/** */` on exported ones, UI text in English. Imports between local files have no extension (bundler resolution). Commit messages are in English, Conventional Commits style, like the playground and the site.
