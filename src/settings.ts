import type { RenderOptions } from "@brewlang/render";

export type ThemeName = "obsidian" | "paper" | "night" | "roaster";
export type CardSize = "small" | "medium";

/** What the reader can change about the cards: their look and the units they show. */
export interface BrewlangSettings {
  theme: ThemeName;
  /** A '#rrggbb' color, or empty for the theme's. */
  accent: string;
  size: CardSize;
  /** 'written': as the author wrote it. */
  weight: "written" | "g" | "oz";
  temp: "written" | "°C" | "°F";
}

export const DEFAULT_SETTINGS: BrewlangSettings = {
  theme: "obsidian",
  accent: "",
  size: "medium",
  weight: "written",
  temp: "written",
};

/// Every color of a card, as brew.css names them without the '--brew-' prefix
type Palette = Record<"bg" | "ink" | "muted" | "faint" | "rule" | "rule-soft" | "soft" | "accent" | "qual" | "qual-line", string>;

/** The themes of the playground's Customize menu, with the same colors. */
export const THEMES: Record<Exclude<ThemeName, "obsidian">, { label: string; palette: Palette }> = {
  paper: {
    label: "Paper",
    palette: {
      bg: "oklch(0.995 0.003 85)",
      ink: "oklch(0.23 0.012 60)",
      muted: "oklch(0.47 0.012 60)",
      faint: "oklch(0.68 0.012 70)",
      rule: "oklch(0.87 0.012 80)",
      "rule-soft": "oklch(0.92 0.01 80)",
      soft: "oklch(0.955 0.01 85)",
      accent: "oklch(0.56 0.15 38)",
      qual: "oklch(0.42 0.1 155)",
      "qual-line": "oklch(0.8 0.04 155)",
    },
  },
  night: {
    label: "Night",
    palette: {
      bg: "oklch(0.225 0 0)",
      ink: "oklch(0.94 0 0)",
      muted: "oklch(0.7 0 0)",
      faint: "oklch(0.5 0 0)",
      rule: "oklch(0.31 0 0)",
      "rule-soft": "oklch(0.27 0 0)",
      soft: "oklch(0.26 0 0)",
      accent: "oklch(0.76 0.13 45)",
      qual: "oklch(0.8 0.1 155)",
      "qual-line": "oklch(0.45 0.06 155)",
    },
  },
  roaster: {
    label: "Roaster",
    palette: {
      bg: "oklch(0.91 0.035 78)",
      ink: "oklch(0.24 0.03 50)",
      muted: "oklch(0.44 0.035 55)",
      faint: "oklch(0.62 0.035 60)",
      rule: "oklch(0.79 0.04 70)",
      "rule-soft": "oklch(0.85 0.035 72)",
      soft: "oklch(0.87 0.04 76)",
      accent: "oklch(0.46 0.13 28)",
      qual: "oklch(0.38 0.08 150)",
      "qual-line": "oklch(0.7 0.05 140)",
    },
  },
};

/** How much each size scales the whole card, text and spacing alike. No larger size: Obsidian cuts a
 *  zoomed-in card at the height it measured. */
export const SIZES: Record<CardSize, { label: string; zoom: number }> = {
  small: { label: "Small", zoom: 0.85 },
  medium: { label: "Medium", zoom: 1 },
};

const HEX = /^#[0-9a-f]{6}$/i;

/// Picks a value among the allowed ones, else the default
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Reads saved settings; anything missing or unknown falls back to the default. */
export function loadSettings(data: unknown): BrewlangSettings {
  const saved = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  return {
    theme: oneOf(saved.theme, ["obsidian", "paper", "night", "roaster"], DEFAULT_SETTINGS.theme),
    accent: typeof saved.accent === "string" && HEX.test(saved.accent) ? saved.accent.toLowerCase() : "",
    size: oneOf(saved.size, ["small", "medium"], DEFAULT_SETTINGS.size),
    weight: oneOf(saved.weight, ["written", "g", "oz"], DEFAULT_SETTINGS.weight),
    temp: oneOf(saved.temp, ["written", "°C", "°F"], DEFAULT_SETTINGS.temp),
  };
}

/** The CSS properties to set on a card: the --brew-* variables and its zoom. None for the default, so the
 *  card follows the Obsidian theme. */
export function cardStyle(settings: BrewlangSettings): Record<string, string> {
  const vars: Record<string, string> = {};
  if (settings.theme !== "obsidian") {
    for (const [name, value] of Object.entries(THEMES[settings.theme].palette)) vars[`--brew-${name}`] = value;
  }
  if (settings.accent) vars["--brew-accent"] = settings.accent;
  if (settings.size !== "medium") vars.zoom = String(SIZES[settings.size].zoom);
  return vars;
}

/** The units the card shows, as @brewlang/render takes them. */
export function renderOptions(settings: BrewlangSettings): RenderOptions {
  const options: RenderOptions = {};
  if (settings.weight !== "written") options.weight = settings.weight;
  if (settings.temp !== "written") options.temp = settings.temp;
  return options;
}
