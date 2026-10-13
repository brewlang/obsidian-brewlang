# Brewlang for Obsidian

Write coffee recipes in your notes with [Brewlang](https://brewlang.github.io), and read them as recipe cards.

````markdown
```brew
---
title: My morning V60
---

@V60 15g 250g 94°C
grind medium-fine

/rinse
0:00 50g ~10s bloom center
0:45 150g ~15s spiral
1:30 250g ~20s center

target 3:00
```
````

In reading view and live preview, the block becomes a card: the title, the specs and the ratio, the preparation, the steps and the target. When Brewlang finds a problem, the card shows the recipe as written and the problems are listed under it, with their line in the block and what to fix:

> Line 3: The scale is already at 50g: pour to a higher total, or add water with '+'

While you edit a block, the recipe is colored, its problems are underlined (hover for the message), and Obsidian suggests brewers after `@`, actions after `/`, grind sizes, pour qualifiers and units as you type.

The card follows your theme, light or dark. In Settings → Brewlang, pick another theme (Paper, Night, Roaster), an accent color or a size (small or medium), and show weights in g or oz and temperatures in °C or °F: only the card changes, never the recipe. For more, a [CSS snippet](https://help.obsidian.md/snippets) can set any of the card's `--brew-*` variables on `.brewlang-block .brew-card`, like the playground's "Copy CSS" gives them.

[Writing recipes](https://brewlang.github.io/doc/guide/writing-recipes/) explains the format; the [playground](https://brewlang.github.io/playground/) lets you try it.

Brewlang is at v0: the syntax can still change.

## Install

Until the plugin is in the community catalog, install it by hand:

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/brewlang/obsidian-brewlang/releases/latest).
2. Put them in a `brewlang` folder in your vault's `.obsidian/plugins/` folder.
3. In Obsidian, open Settings → Community plugins, and turn on **Brewlang**.

## Development

The plugin bundles the language from the [brewlang](https://github.com/brewlang/brewlang) repo, cloned next to this one and built:

```sh
git clone https://github.com/brewlang/brewlang ../brewlang
(cd ../brewlang && npm install && npm run build)

npm install
npm test        # the block rendering
npm run build   # main.js and styles.css
npm run dev     # rebuild on change
```

To try it, link this folder into a test vault: `ln -s "$PWD" /path/to/vault/.obsidian/plugins/brewlang`, then reload Obsidian.

**Release:** bump `version` in `manifest.json` and `package.json`, add it to `versions.json` with the minimum Obsidian version, then push a tag with the same name (`0.1.1`, no `v`). The release workflow builds the plugin and attaches the three files.

## License

[MIT](LICENSE)
