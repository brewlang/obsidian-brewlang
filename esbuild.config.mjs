import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import esbuild from "esbuild";

const production = process.argv[2] === "production";
const require = createRequire(import.meta.url);

// styles.css: the card's brew.css from @brewlang/render, then the plugin's own rules, which map it onto the theme
const css = () =>
  writeFileSync(
    "styles.css",
    `${readFileSync(require.resolve("@brewlang/render/brew.css"), "utf8")}\n${readFileSync("src/styles.css", "utf8")}`,
  );

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  // Obsidian provides these at runtime; brewlang and @brewlang/render are bundled into main.js
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  target: "es2021",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  minify: production,
  outfile: "main.js",
  plugins: [{ name: "styles", setup: (build) => build.onEnd(css) }],
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
