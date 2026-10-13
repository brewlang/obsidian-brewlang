import type { Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo } from "obsidian";
import { EditorSuggest } from "obsidian";
import type { Option } from "./complete";
import { complete } from "./complete";
import { brewBlocks } from "./highlight";

/** Offers brewers, actions, grind sizes, qualifiers and units while typing in a ```brew block, in Obsidian's own
 *  suggestion popup. */
export class BrewSuggest extends EditorSuggest<Option> {
  /// The options found by onTrigger, for getSuggestions
  private options: Option[] = [];

  override onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
    const note = editor.getValue();
    if (!note.includes("brew")) return null;
    const at = editor.posToOffset(cursor);
    const block = brewBlocks(note).find((b) => at >= b.from && at <= b.to);
    if (!block) return null;

    const found = complete(note.slice(block.from, block.to), at - block.from);
    if (!found) return null;
    this.options = found.options;
    const start = editor.offsetToPos(block.from + found.from);
    return { start, end: cursor, query: editor.getRange(start, cursor) };
  }

  override getSuggestions(): Option[] {
    return this.options;
  }

  override renderSuggestion(option: Option, el: HTMLElement) {
    el.addClass("mod-complex");
    const content = el.createDiv({ cls: "suggestion-content" });
    content.createDiv({ cls: "suggestion-title", text: option.label });
    if (option.detail) content.createDiv({ cls: "suggestion-note", text: option.detail });
  }

  override selectSuggestion(option: Option) {
    const context: EditorSuggestContext | null = this.context;
    if (!context) return;
    const text = option.apply ?? option.label;
    context.editor.replaceRange(text, context.start, context.end);
    context.editor.setCursor(context.editor.offsetToPos(context.editor.posToOffset(context.start) + text.length));
    this.close();
  }
}
