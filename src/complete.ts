import type { BrewerType } from "brewlang";
import {
  ACTION_ALIASES,
  ACTIONS,
  BREWERS,
  DOSE_UNITS,
  GRIND_SIZES,
  QUALIFIERS,
  TEMP_UNITS,
  WATER_UNITS,
  findBrewer,
} from "brewlang";

// The playground's complete.ts, on plain text: every list comes from brewlang, so the completion never offers
// what the checker would refuse. Obsidian opens suggestions as you type, so each case needs a letter typed

/** A word to offer: the label shown, a detail next to it, and the text it writes when other than the label. */
export interface Option {
  label: string;
  detail?: string;
  apply?: string;
}

/** What to offer at a position of a recipe: the options, and where the word they replace starts. */
export interface Completion {
  from: number;
  options: Option[];
}

const BREWER_OPTIONS: Option[] = BREWERS.map((brewer) => ({ label: `@${brewer.name}`, detail: brewer.type }));
const GRIND_OPTIONS: Option[] = GRIND_SIZES.map((size) => ({ label: size }));
const KEYWORD_OPTIONS: Option[] = [
  { label: "grind", detail: "grind size", apply: "grind " },
  { label: "target", detail: "end time", apply: "target " },
];

/// Pour qualifiers that say how to pour; only one per pour
const TECHNIQUES: readonly string[] = ["spiral", "center", "pulse"];

const units = (list: readonly string[], detail: string): Option[] => list.map((unit) => ({ label: unit, detail }));
const DOSE = units(DOSE_UNITS, "dose");
const WATER = units(WATER_UNITS, "water");
const TEMP = units(TEMP_UNITS, "temperature");
const DURATION = units(["s", "m"], "duration");

/// The type of the brewer named in the header; undefined when absent or unknown
function brewerType(recipe: string): BrewerType | undefined {
  const match = /^\s*@(\S+)/m.exec(recipe);
  return match?.[1] ? findBrewer(match[1])?.type : undefined;
}

/// Known actions allowed with this brewer type, aliases included; an unknown brewer allows them all
function actionOptions(type: BrewerType | undefined): Option[] {
  const allowed = (name: string) => {
    const types = ACTIONS[name]?.types;
    return !type || !types || types.includes(type);
  };
  const options = Object.keys(ACTIONS)
    .filter(allowed)
    .map((name): Option => {
      const types = ACTIONS[name]?.types;
      return types ? { label: `/${name}`, detail: types.join(", ") } : { label: `/${name}` };
    });
  for (const [alias, name] of Object.entries(ACTION_ALIASES)) {
    if (allowed(name)) options.push({ label: `/${alias}`, detail: `= /${name}` });
  }
  return options;
}

/// True inside the '---' frontmatter at the top of the recipe; index counts from 0
function inFrontmatter(lines: string[], index: number): boolean {
  if (lines[0]?.trim() !== "---") return false;
  for (let n = 1; n < index; n++) if (lines[n]?.trim() === "---") return false;
  return index > 0;
}

/// Options that start like the word typed, the degree sign aside: '94c' gives '°C'
function matching(word: string, options: Option[]): Option[] {
  const bare = (text: string) => text.toLowerCase().replace("°", "");
  return options.filter((option) => bare(option.label).startsWith(bare(word)));
}

/// What a line offers before the cursor, and the word it replaces
function offer(before: string, recipe: string): { word: string; options: Option[] } | undefined {
  // '@V' at the start of a line: the brewer of the header
  let match = /^\s*(@[\w-]*)$/.exec(before);
  if (match) return { word: match[1]!, options: BREWER_OPTIONS };

  // '/sw', alone or after a time: an action, filtered by the brewer
  match = /^\s*(?:\d+:\d\d\s+)?(\/[\w-]*)$/.exec(before);
  if (match) return { word: match[1]!, options: actionOptions(brewerType(recipe)) };

  // 'grind me'
  match = /^\s*grind\s+([\w-]*)$/.exec(before);
  if (match) return { word: match[1]!, options: GRIND_OPTIONS };

  // A unit right after a number, once a letter is typed ('94c' -> '°C'): which ones depends on the line
  match = /(~?)\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?([a-z°]*)$/i.exec(before);
  if (match) {
    const [, tilde, unit = ""] = match;
    if (!unit) return undefined;
    if (tilde) return { word: unit, options: DURATION };
    if (/^\s*@/.test(before)) {
      // Header: the dose comes first, then the water or the temperature
      const written = before.match(/\d[\d.\-]*[a-z°]+/gi)?.length ?? 0;
      return { word: unit, options: written - 1 === 0 ? DOSE : [...WATER, ...TEMP] };
    }
    // A time or a '+' makes it a pour: a temperature line has neither
    if (/^\s*(?:\d+:\d\d\s|\+)/.test(before)) return { word: unit, options: WATER };
    return { word: unit, options: [...WATER, ...TEMP] };
  }

  // A word after a pour amount: its qualifiers, without the ones already there
  const pour = /^\s*(?:\d+:\d\d\s+)?\+?\d[\d.\-]*(?:g|ml|oz|floz)\b(.*?)([a-z]*)$/i.exec(before);
  if (pour) {
    const word = pour[2] ?? "";
    if (!word) return undefined;
    const written = (pour[1] ?? "").split(/\s+/);
    const hasTechnique = written.some((w) => TECHNIQUES.includes(w));
    const options = QUALIFIERS.filter((q) => !written.includes(q) && !(hasTechnique && TECHNIQUES.includes(q))).map(
      (q): Option => ({ label: q, detail: TECHNIQUES.includes(q) ? "technique" : "qualifier" }),
    );
    return { word, options };
  }

  // A word at the start of a line, before any header or step keyword
  match = /^\s*([a-z]+)$/.exec(before);
  if (match) return { word: match[1]!, options: KEYWORD_OPTIONS };

  return undefined;
}

/** Completes brewers, actions, grind sizes, qualifiers, keywords and units at an offset of a recipe; undefined
 *  when nothing fits, or when the word is already complete. */
export function complete(recipe: string, at: number): Completion | undefined {
  const lines = recipe.slice(0, at).split("\n");
  const before = lines[lines.length - 1]!;
  if (before.includes("--") || inFrontmatter(recipe.split("\n"), lines.length - 1)) return undefined;

  const found = offer(before, recipe);
  if (!found) return undefined;
  const options = matching(found.word, found.options);
  if (options.length === 0 || (options.length === 1 && options[0]!.label === found.word)) return undefined;
  return { from: at - found.word.length, options };
}
