import type { Severity } from "brewlang";
import { check } from "brewlang";

/** A problem Brewlang found in a recipe, on the word it points at, as offsets in its source. */
export interface Lint {
  from: number;
  to: number;
  severity: Severity;
  message: string;
}

/** The problems of a recipe, each on its word, like the playground's lint.ts underlines them. */
export function lint(source: string): Lint[] {
  const lines = source.split("\n");
  const starts = [0];
  for (const line of lines) starts.push(starts[starts.length - 1]! + line.length + 1);

  return check(source).diagnostics.map(({ severity, message, line, column }) => {
    const index = Math.min(Math.max(line, 1), lines.length) - 1;
    const text = lines[index]!;
    const offset = Math.min(column - 1, text.length);
    const word = /\S+/y;
    word.lastIndex = offset;
    const length = word.exec(text)?.[0].length ?? text.length - offset;
    const from = starts[index]! + offset;
    return { from, to: from + length, severity, message };
  });
}
