import type { Severity } from "brewlang";
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
 * block's first line, as the reader sees them.
 */
export function renderBlock(source: string): Block {
  const { html, diagnostics } = render(source);
  return {
    html,
    problems: diagnostics.map((d) => ({ severity: d.severity, text: `Line ${d.line}: ${d.message}` })),
  };
}
