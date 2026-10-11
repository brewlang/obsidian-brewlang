import { Plugin, sanitizeHTMLToDom } from "obsidian";
import { renderBlock } from "./block";

/** Shows every ```brew code block of a note as a recipe card. */
export default class BrewlangPlugin extends Plugin {
  override async onload() {
    this.registerMarkdownCodeBlockProcessor("brew", (source, el) => {
      const { html, problems } = renderBlock(source);
      el.addClass("brewlang-block");
      el.appendChild(sanitizeHTMLToDom(html));

      if (problems.length === 0) return;
      const list = el.createEl("ul", { cls: "brewlang-problems" });
      for (const problem of problems) list.createEl("li", { cls: `is-${problem.severity}`, text: problem.text });
    });
  }
}
