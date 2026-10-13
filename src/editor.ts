import { RangeSetBuilder } from "@codemirror/state";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { Role } from "./highlight";
import { brewBlocks, highlight } from "./highlight";

const MARKS = new Map<Role, Decoration>();
/// One mark per role, made once: 'brewlang-tok-amount'
const mark = (role: Role) => {
  let decoration = MARKS.get(role);
  if (!decoration) MARKS.set(role, (decoration = Decoration.mark({ class: `brewlang-tok-${role}` })));
  return decoration;
};

/// Color the recipe of every ```brew block of the note
function decorate(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const note = view.state.doc.toString();
  for (const block of brewBlocks(note)) {
    for (const span of highlight(note.slice(block.from, block.to))) {
      builder.add(block.from + span.from, block.from + span.to, mark(span.role));
    }
  }
  return builder.finish();
}

/** Colors the ```brew blocks of a note in the editor, source mode and Live Preview, with the brewlang lexer. */
export const brewHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = decorate(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) this.decorations = decorate(update.view);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
