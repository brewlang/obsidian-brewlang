import type { Token } from "brewlang";
import { GRIND_SIZES, QUALIFIERS, lex } from "brewlang";

// The brewlang lexer is the only grammar, so the colors never drift from it: the same roles as the playground's
// highlight.ts. Tokens written without a space between them ('150g', '~15s', '90-93°C') form one word

export type Role =
  | "brewer"
  | "amount"
  | "temp"
  | "time"
  | "dur"
  | "qual"
  | "action"
  | "kw"
  | "grind"
  | "comment"
  | "punct"
  | "fmkey"
  | "fmval"
  | "error";

/** A colored stretch of a recipe, as offsets in its source. */
export interface Span {
  from: number;
  to: number;
  role: Role;
}

/// The role of a word from its tokens: '150g' is an amount, '90°C' a temperature, '~15s' a duration
function role(word: Token[]): Role | undefined {
  const [first] = word;
  if (!first) return undefined;
  if (word.some((t) => t.kind === "ERROR")) return "error";

  switch (first.kind) {
    case "BREWER":
      return "brewer";
    case "ACTION":
      return "action";
    case "TIME":
      return "time";
    case "TILDE":
      return "dur";
    case "COMMENT":
      return "comment";
    case "PLUS":
    case "NUMBER":
      return word.some((t) => t.kind === "UNIT" && t.text.startsWith("°")) ? "temp" : "amount";
    case "WORD":
      if (first.text === "grind" || first.text === "target") return "kw";
      if ((QUALIFIERS as readonly string[]).includes(first.text)) return "qual";
      if ((GRIND_SIZES as readonly string[]).includes(first.text)) return "grind";
      return undefined;
    default:
      return undefined;
  }
}

/** The colored spans of a recipe, in order; lines and columns of the lexer are 1-based. */
export function highlight(source: string): Span[] {
  const starts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") starts.push(i + 1);
  const offset = (t: Token) => (starts[t.line - 1] ?? source.length) + t.column - 1;

  const spans: Span[] = [];
  const add = (from: number, to: number, role: Role) => {
    if (to > from) spans.push({ from, to: Math.min(to, source.length), role });
  };
  const tokens = lex(source).tokens.filter((t) => t.text && t.kind !== "NEWLINE" && t.line <= starts.length);
  let i = 0;

  while (i < tokens.length) {
    const first = tokens[i]!;

    // The metadata block: '---' lines, then 'key: value'
    if (first.kind === "FRONTMATTER") {
      let from = offset(first);
      for (const line of first.text.split("\n")) {
        const key = /^([\w-]+)(:)/.exec(line);
        if (/^---\s*$/.test(line)) add(from, from + 3, "punct");
        else if (key) {
          add(from, from + key[1]!.length, "fmkey");
          add(from + key[0].length, from + line.length, "fmval");
        } else if (line.trim()) add(from, from + line.length, "fmval");
        from += line.length + 1;
      }
      i++;
      continue;
    }

    // A word: the tokens that follow each other without a gap, a comment always on its own
    const word = [first];
    let end = offset(first) + first.text.length;
    while (first.kind !== "COMMENT" && i + word.length < tokens.length) {
      const next = tokens[i + word.length]!;
      if (next.kind === "COMMENT" || offset(next) !== end) break;
      word.push(next);
      end += next.text.length;
    }

    const name = role(word);
    if (name) add(offset(first), end, name);
    i += word.length;
  }

  return spans;
}

/** A recipe cut into its colored and plain stretches, in order, to show it as code. */
export function pieces(source: string): { text: string; role?: Role }[] {
  const out: { text: string; role?: Role }[] = [];
  let at = 0;
  for (const { from, to, role } of highlight(source)) {
    if (from > at) out.push({ text: source.slice(at, from) });
    out.push({ text: source.slice(from, to), role });
    at = to;
  }
  if (at < source.length) out.push({ text: source.slice(at) });
  return out;
}

/** The ```brew blocks of a note: where the recipe inside each starts and ends, fences excluded. */
export function brewBlocks(note: string): { from: number; to: number }[] {
  const blocks: { from: number; to: number }[] = [];
  let open: { fence: string; from: number } | undefined;
  let at = 0;

  for (const line of note.split("\n")) {
    const next = at + line.length + 1;
    if (!open) {
      const start = /^\s*(`{3,}|~{3,})\s*brew\s*$/.exec(line);
      if (start) open = { fence: start[1]!, from: next };
    } else {
      const close = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
      if (close && close[1]![0] === open.fence[0] && close[1]!.length >= open.fence.length) {
        blocks.push({ from: open.from, to: Math.max(open.from, at - 1) });
        open = undefined;
      }
    }
    at = next;
  }
  // A block not closed yet, while typing: to the end of the note
  if (open && open.from <= note.length) blocks.push({ from: open.from, to: note.length });
  return blocks;
}
