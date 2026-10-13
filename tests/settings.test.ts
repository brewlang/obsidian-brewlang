import { describe, expect, test } from "vitest";
import { renderBlock } from "../src/block";
import { cardStyle, DEFAULT_SETTINGS, loadSettings, renderOptions } from "../src/settings";

describe("loadSettings", () => {
  test("nothing saved gives the default", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  test("known values are kept, unknown ones fall back to the default", () => {
    expect(loadSettings({ theme: "roaster", accent: "#AA3300", size: "small", weight: "oz", temp: "kelvin" })).toEqual({
      theme: "roaster",
      accent: "#aa3300",
      size: "small",
      weight: "oz",
      temp: "written",
    });
    expect(loadSettings({ theme: "neon", accent: "red" })).toEqual(DEFAULT_SETTINGS);
  });
});

describe("cardStyle", () => {
  test("the default sets nothing, so the card follows the Obsidian theme", () => {
    expect(cardStyle(DEFAULT_SETTINGS)).toEqual({});
  });

  test("a theme sets its whole palette, and the accent goes over it", () => {
    const vars = cardStyle({ ...DEFAULT_SETTINGS, theme: "night", accent: "#123456" });
    expect(vars["--brew-bg"]).toBe("oklch(0.225 0 0)");
    expect(vars["--brew-accent"]).toBe("#123456");
  });

  test("the small size zooms the card out", () => {
    expect(cardStyle({ ...DEFAULT_SETTINGS, size: "small" })).toEqual({ zoom: "0.85" });
  });
});

describe("renderOptions", () => {
  test("'as written' converts nothing", () => {
    expect(renderOptions(DEFAULT_SETTINGS)).toEqual({});
  });

  test("the card shows the chosen units", () => {
    const { html } = renderBlock("@V60 15g 250g 94°C\n0:00 250g", renderOptions({ ...DEFAULT_SETTINGS, temp: "°F" }));
    expect(html).toContain("°F");
    expect(html).not.toContain("94°C");
  });
});
