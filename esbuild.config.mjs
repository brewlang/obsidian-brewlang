import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import esbuild from "esbuild";

const production = process.argv[2] === "production";
const require = createRequire(import.meta.url);

// Instrument Sans, the card's font, inlined: a plugin ships as main.js and styles.css, and loads nothing from the web.
// Latin only (it covers French accents), upright and italic, weights 400 to 700; other letters fall back to system-ui
const font = (style) => {
  const file = require.resolve(`@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-${style}.woff2`);
  return `@font-face {
  font-family: "Instrument Sans";
  font-style: ${style};
  font-display: swap;
  font-weight: 400 700;
  src: url(data:font/woff2;base64,${readFileSync(file).toString("base64")}) format("woff2-variations");
}
`;
};

// styles.css: the font, the card's brew.css from @brewlang/render, then the plugin's own rules, which map it onto the theme
const css = () =>
  writeFileSync(
    "styles.css",
    `${font("normal")}${font("italic")}${readFileSync(require.resolve("@brewlang/render/brew.css"), "utf8")}\n${readFileSync("src/styles.css", "utf8")}`,
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
