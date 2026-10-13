import type { Range } from "@codemirror/state";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { Role } from "./highlight";
import { brewBlocks, highlight } from "./highlight";
import { lint } from "./lint";

const MARKS = new Map<Role, Decoration>();
/// One mark per role, made once: 'brewlang-tok-amount'
const mark = (role: Role) => {
  let decoration = MARKS.get(role);
  if (!decoration) MARKS.set(role, (decoration = Decoration.mark({ class: `brewlang-tok-${role}` })));
  return decoration;
};

/// Color the recipe of every ```brew block of the note, and underline its problems, the message on hover
function decorate(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const note = view.state.doc.toString();
  for (const block of brewBlocks(note)) {
    const recipe = note.slice(block.from, block.to);
    for (const span of highlight(recipe)) ranges.push(mark(span.role).range(block.from + span.from, block.from + span.to));
    for (const problem of lint(recipe)) {
      if (problem.to <= problem.from) continue;
      const underline = Decoration.mark({
        class: `brewlang-lint brewlang-lint-${problem.severity}`,
        attributes: { title: problem.message },
      });
      ranges.push(underline.range(block.from + problem.from, block.from + problem.to));
    }
  }
  return Decoration.set(ranges, true);
}

/** Colors the ```brew blocks of a note in the editor, source mode and Live Preview, with the brewlang lexer, and
 *  underlines what brewlang's check finds. */
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
