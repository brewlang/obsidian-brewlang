import { MarkdownRenderChild, Plugin, sanitizeHTMLToDom } from "obsidian";
import { renderBlock } from "./block";
import { brewHighlight } from "./editor";
import { pieces } from "./highlight";
import type { BrewlangSettings } from "./settings";
import { cardStyle, loadSettings, renderOptions } from "./settings";
import { BrewSuggest } from "./suggest";
import { BrewlangSettingTab } from "./tab";

/// A card shown in a note, kept while the note shows it so a change of settings can redraw it
class Card extends MarkdownRenderChild {
  constructor(
    el: HTMLElement,
    private readonly source: string,
    private readonly plugin: BrewlangPlugin,
  ) {
    super(el);
  }

  override onload() {
    this.plugin.cards.add(this);
    this.draw();
  }

  override onunload() {
    this.plugin.cards.delete(this);
  }

  draw() {
    const { settings } = this.plugin;
    const { html, problems } = renderBlock(this.source, renderOptions(settings));
    const el = this.containerEl;
    el.empty();
    el.addClass("brewlang-block");

    // The recipe as written, colored like the editor: text nodes and spans, no HTML to parse
    if (settings.display !== "card") {
      const code = el.createEl("pre", { cls: "brewlang-code" }).createEl("code");
      for (const { text, role } of pieces(this.source.replace(/\n$/, ""))) {
        if (role) code.createSpan({ cls: `brewlang-tok-${role}`, text });
        else code.appendText(text);
      }
    }

    if (settings.display !== "code") {
      el.appendChild(sanitizeHTMLToDom(html));
      const card = el.querySelector<HTMLElement>(".brew-card");
      for (const [name, value] of Object.entries(cardStyle(settings))) card?.style.setProperty(name, value);
    }

    if (problems.length === 0) return;
    const list = el.createEl("ul", { cls: "brewlang-problems" });
    for (const problem of problems) list.createEl("li", { cls: `is-${problem.severity}`, text: problem.text });
  }
}

/** Shows every ```brew code block of a note as a recipe card, its colored code or both, as the settings say,
 *  and colors, checks and completes the recipe while editing it. */
export default class BrewlangPlugin extends Plugin {
  settings!: BrewlangSettings;
  readonly cards = new Set<Card>();

  override async onload() {
    this.settings = loadSettings(await this.loadData());
    this.addSettingTab(new BrewlangSettingTab(this.app, this));
    this.registerEditorExtension(brewHighlight);
    this.registerEditorSuggest(new BrewSuggest(this.app));
    this.registerMarkdownCodeBlockProcessor("brew", (source, el, ctx) => {
      ctx.addChild(new Card(el, source, this));
    });
  }

  /** Saves a change of settings and redraws every card on screen with it. */
  async updateSettings(change: Partial<BrewlangSettings>) {
    this.settings = { ...this.settings, ...change };
    await this.saveData(this.settings);
    for (const card of this.cards) card.draw();
  }
}
