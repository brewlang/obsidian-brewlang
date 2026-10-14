import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type BrewlangPlugin from "./main";
import type { BrewlangSettings, CardSize, Display, ThemeName } from "./settings";
import { DISPLAYS, SIZES, THEMES } from "./settings";

/** The settings: what a block shows, the cards' theme, accent and size, and the units they show. */
export class BrewlangSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: BrewlangPlugin,
  ) {
    super(app, plugin);
  }

  override display() {
    const { containerEl } = this;
    const { settings } = this.plugin;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Display")
      .setDesc("What a brew code block shows in reading view. The problems are listed under it either way.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(DISPLAYS)
          .setValue(settings.display)
          .onChange((value) => this.plugin.updateSettings({ display: value as Display })),
      );

    new Setting(containerEl).setName("Card").setHeading();

    new Setting(containerEl)
      .setName("Theme")
      .setDesc("Obsidian follows your theme, light or dark. The others look the same everywhere.")
      .addDropdown((dropdown) => {
        dropdown.addOption("obsidian", "Obsidian");
        for (const [name, { label }] of Object.entries(THEMES)) dropdown.addOption(name, label);
        dropdown.setValue(settings.theme).onChange((value) => this.plugin.updateSettings({ theme: value as ThemeName }));
      });

    new Setting(containerEl)
      .setName("Accent color")
      .setDesc("The card's highlight color. Reset to use the theme's.")
      .addColorPicker((picker) =>
        picker.setValue(settings.accent || "#7852ee").onChange((value) => this.plugin.updateSettings({ accent: value })),
      )
      .addExtraButton((button) =>
        button
          .setIcon("rotate-ccw")
          .setTooltip("Use the theme's color")
          .onClick(async () => {
            await this.plugin.updateSettings({ accent: "" });
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName("Size")
      .setDesc("Scales the whole card, text and spacing alike.")
      .addDropdown((dropdown) => {
        for (const [name, { label }] of Object.entries(SIZES)) dropdown.addOption(name, label);
        dropdown.setValue(settings.size).onChange((value) => this.plugin.updateSettings({ size: value as CardSize }));
      });

    new Setting(containerEl).setName("Units").setHeading();

    new Setting(containerEl)
      .setName("Weights")
      .setDesc("Only what the card shows: the recipe keeps its own units.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({ written: "As written", g: "Grams (g)", oz: "Ounces (oz)" })
          .setValue(settings.weight)
          .onChange((value) => this.plugin.updateSettings({ weight: value as BrewlangSettings["weight"] })),
      );

    new Setting(containerEl)
      .setName("Temperatures")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({ written: "As written", "°C": "Celsius (°C)", "°F": "Fahrenheit (°F)" })
          .setValue(settings.temp)
          .onChange((value) => this.plugin.updateSettings({ temp: value as BrewlangSettings["temp"] })),
      );
  }
}
