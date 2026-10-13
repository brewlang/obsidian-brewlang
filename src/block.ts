import type { Severity } from "brewlang";
import type { RenderOptions } from "@brewlang/render";
import { render } from "@brewlang/render";

/** A problem Brewlang found in a block, ready to show under the card. */
export interface Problem {
  severity: Severity;
  text: string;
}

/** What a ```brew block shows: the card's HTML, and the problems in the order of the block. */
export interface Block {
  html: string;
  problems: Problem[];
}

/**
 * Renders the source of a ```brew block. The card is @brewlang/render's, every text escaped; with
 * errors, it shows the recipe as parsed, and the problems say what to fix. Lines count from the
 * block's first line, as the reader sees them. The options convert the units shown; when they cannot
 * apply, a problem says why and the card keeps the author's units.
 */
export function renderBlock(source: string, options: RenderOptions = {}): Block {
  const { html, diagnostics, notes } = render(source, options);
  return {
    html,
    problems: [...diagnostics, ...notes].map((d) => ({ severity: d.severity, text: `Line ${d.line}: ${d.message}` })),
  };
}
