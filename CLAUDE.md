# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

An Obsidian plugin for Brewlang, the `.brew` coffee recipe language: it shows every ```` ```brew ```` code block of a note as a recipe card. All language logic lives in the `brewlang` monorepo next to this repo (`../brewlang`): the language (`packages/brewlang`) and the card (`packages/render`, `@brewlang/render`). The plugin only displays what they return.

## Commands

- `npm test` — Vitest: `tests/block.test.ts`, `tests/settings.test.ts`, `tests/highlight.test.ts`
- `npm run build` — `tsc --noEmit`, then esbuild: `main.js` (brewlang and @brewlang/render bundled in, `obsidian` external) and `styles.css`
- `npm run dev` — esbuild in watch mode, with inline source maps

## Dependency on brewlang

`"brewlang"` and `"@brewlang/render"` are `file:` links to `../brewlang/packages/*`, resolved through their `dist/`: run `npm run build` in `../brewlang` after changing it. They are bundled into `main.js`, since the packages are not on npm yet.

## Code

- `src/block.ts` — `renderBlock(source, options)`: `render()` from @brewlang/render, and its diagnostics and notes as `Line n: message`, numbered from the block's first line. Pure, so it is what the tests cover.
- `src/settings.ts` — the settings (theme, accent, weight and temperature units), pure: `loadSettings` checks saved data, `cardVariables` gives the `--brew-*` variables (none for the `obsidian` theme), `renderOptions` the units for `render()`. The themes are the playground's (`playground/src/customize.ts`), same colors.
- `src/main.ts` — the plugin: `registerMarkdownCodeBlockProcessor("brew", …)` adds a `Card` (a `MarkdownRenderChild`) that puts the card in the block with `sanitizeHTMLToDom` (never `innerHTML`, per Obsidian's plugin guidelines; the HTML is escaped anyway), sets the variables on `.brew-card`, and lists the problems under it. The plugin keeps the cards on screen and redraws them when a setting changes.
- `src/tab.ts` — the settings tab.
- `src/highlight.ts` — pure: `highlight(source)` gives the colored spans of a recipe, from `lex()`, with the roles of the playground's `highlight.ts`; `brewBlocks(note)` finds the recipe inside each ```` ```brew ```` fence of a note (an unclosed one runs to the end).
- `src/editor.ts` — `brewHighlight`, the CodeMirror `ViewPlugin` registered with `registerEditorExtension`: marks `brewlang-tok-<role>` over every block, in source mode and Live Preview. `@codemirror/*` are dev dependencies for the types only, pinned to the versions `obsidian` asks for: Obsidian provides them at runtime, never bundle a second copy.
- `src/styles.css` — sets the card in Instrument Sans (`@fontsource-variable/instrument-sans`, inlined as base64 by `esbuild.config.mjs`: a plugin loads nothing from the web) and maps the card's `--brew-*` variables onto the Obsidian theme (`--background-primary`, `--text-normal`, `--font-monospace`…); the accent is the theme's (`--color-accent`), and `.theme-dark` gets brew.css's dark qualifier colors; the `brewlang-tok-*` colors are the theme's `--code-*`. `esbuild.config.mjs` writes `styles.css` as brew.css followed by this file.
- `main.js` and `styles.css` are build outputs, ignored by git; releases attach them.

## Releases

`manifest.json` (`id: brewlang`, `version`, `minAppVersion`), `package.json` and `versions.json` (version → minimum Obsidian version) change together. Pushing a tag named exactly like the version (`0.1.0`, no `v`) runs `.github/workflows/release.yml`, which checks the tag against the manifest and publishes a release with `main.js`, `manifest.json` and `styles.css`. `ci.yml` tests and builds pull requests and `main`, with brewlang checked out next to the plugin.

## Conventions

Same as `../brewlang`: strict TS with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, `import type` for types, 2-space indent, `///` comments on internal members and `/** */` on exported ones, UI text in English. Imports between local files have no extension (bundler resolution). Commit messages are in English, Conventional Commits style, like the playground and the site.
