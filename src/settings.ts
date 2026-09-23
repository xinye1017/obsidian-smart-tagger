import { App, PluginSettingTab, Setting } from "obsidian";
import type JevTaggerPlugin from "./main";
import type { TagDefinition } from "./jevClient";
import { BatchTagModal } from "./batchTagModal";
import { Language, LANGUAGES, LANGUAGE_OPTIONS, t } from "./i18n";

export interface JevTaggerSettings {
	apiKey: string;
	endpoint: string;
	language: Language;
	confidenceThreshold: number;
	tags: TagDefinition[];
}

export const DEFAULT_SETTINGS: JevTaggerSettings = {
	apiKey: "",
	endpoint: "https://api.typesafe.ai/v1/systemone",
	language: "zh",
	confidenceThreshold: 0.70,
	tags: [],
};

export class JevTaggerSettingTab extends PluginSettingTab {
	plugin: JevTaggerPlugin;

	constructor(app: App, plugin: JevTaggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("jev-settings-container");

		const lang = this.plugin.settings.language;

		// 1. Header Block
		const headerEl = containerEl.createDiv({ cls: "jev-settings-header" });
		headerEl.createEl("h2", { text: t(lang, "settings.title") });
		headerEl.createEl("p", {
			text: t(lang, "settings.subtitle"),
			cls: "setting-item-description",
		});

		// 2. General Settings
		new Setting(containerEl).setHeading().setName(t(lang, "settings.section.general"));

		// Language
		new Setting(containerEl)
			.setName(t(lang, "settings.language.name"))
			.setDesc(t(lang, "settings.language.desc"))
			.addDropdown((dropdown) => {
				LANGUAGES.forEach((key) => {
					dropdown.addOption(key, LANGUAGE_OPTIONS[key]);
				});
				dropdown.setValue(lang).onChange(async (value) => {
					this.plugin.settings.language = value as Language;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		// API Key
		let keyInputEl: HTMLInputElement;
		let isRevealed = false;

		new Setting(containerEl)
			.setName(t(lang, "settings.apiKey.name"))
			.setDesc(t(lang, "settings.apiKey.desc"))
			.addText((text) => {
				keyInputEl = text.inputEl;
				keyInputEl.type = "password";
				keyInputEl.placeholder = "apikey_...";
				keyInputEl.addClass("jev-settings-apikey-input");
				text.setValue(this.plugin.settings.apiKey).onChange(async (value) => {
					this.plugin.settings.apiKey = value.trim();
					await this.plugin.saveSettings();
				});
			})
			.addExtraButton((btn) => {
				btn.setIcon("eye-off")
					.setTooltip(t(lang, "settings.apiKey.toggleTooltip"))
					.onClick(() => {
						isRevealed = !isRevealed;
						keyInputEl.type = isRevealed ? "text" : "password";
						btn.setIcon(isRevealed ? "eye" : "eye-off");
					});
			});

		// Threshold Setting with real-time percentage badge
		const thresholdSetting = new Setting(containerEl)
			.setName(t(lang, "settings.threshold.name"))
			.setDesc(t(lang, "settings.threshold.desc"));

		const currentPct = Math.round(this.plugin.settings.confidenceThreshold * 100);
		const badgeEl = thresholdSetting.controlEl.createSpan({
			cls: "jev-threshold-badge",
			text: `${currentPct}%`,
		});

		thresholdSetting.addSlider((slider) =>
			slider
				.setLimits(0.1, 0.95, 0.05)
				.setValue(this.plugin.settings.confidenceThreshold)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.confidenceThreshold = value;
					badgeEl.setText(`${Math.round(value * 100)}%`);
					await this.plugin.saveSettings();
				})
		);
		thresholdSetting.controlEl.prepend(badgeEl);

		// 3. Batch Actions & Maintenance
		new Setting(containerEl).setHeading().setName(t(lang, "settings.section.actions"));

		new Setting(containerEl)
			.setName(t(lang, "settings.batch.name"))
			.setDesc(t(lang, "settings.batch.desc"))
			.addButton((btn) =>
				btn
					.setButtonText(t(lang, "settings.batch.button"))
					.setCta()
					.onClick(() => {
						new BatchTagModal(this.app, this.plugin).open();
					})
			);

		new Setting(containerEl)
			.setName(t(lang, "settings.sync.name"))
			.setDesc(t(lang, "settings.sync.desc"))
			.addButton((btn) =>
				btn.setButtonText(t(lang, "settings.sync.button")).onClick(async () => {
					await this.plugin.detectAndSyncVaultTags();
					this.display();
				})
			);

		// 4. Tag Criteria Library
		new Setting(containerEl)
			.setHeading()
			.setName(t(lang, "settings.section.tags"))
			.setDesc(t(lang, "settings.tagLibrary.desc"));

		const tags = this.plugin.settings.tags;
		const totalTags = tags.length;

		if (totalTags > 0) {
			const enabledCount = tags.filter((tag) => tag.enabled).length;

			// Toolbar with stats & bulk toggle buttons
			const toolbar = containerEl.createDiv({ cls: "jev-tag-toolbar" });
			const statsEl = toolbar.createDiv({
				cls: "jev-tag-stats",
				text: t(lang, "settings.tagLibrary.stats", { total: totalTags, enabled: enabledCount }),
			});

			const toolbarButtons = toolbar.createDiv({ cls: "jev-tag-toolbar-buttons" });
			const enableAllBtn = toolbarButtons.createEl("button", {
				cls: "jev-tag-action-btn",
				text: t(lang, "settings.tagLibrary.enableAll"),
			});
			enableAllBtn.onclick = async () => {
				tags.forEach((tag) => (tag.enabled = true));
				await this.plugin.saveSettings();
				this.display();
			};

			const disableAllBtn = toolbarButtons.createEl("button", {
				cls: "jev-tag-action-btn",
				text: t(lang, "settings.tagLibrary.disableAll"),
			});
			disableAllBtn.onclick = async () => {
				tags.forEach((tag) => (tag.enabled = false));
				await this.plugin.saveSettings();
				this.display();
			};

			// Card Grid
			const tagGrid = containerEl.createDiv({ cls: "jev-tag-library-grid" });
			tags.forEach((tag, index) => {
				const tagCard = tagGrid.createDiv({
					cls: `jev-tag-card ${tag.enabled ? "is-enabled" : "is-disabled"}`,
				});

				// Left: Tag pill with # symbol
				const chip = tagCard.createDiv({ cls: "jev-tag-card-chip" });
				chip.createSpan({ cls: "jev-tag-hash", text: "#" });
				const nameEl = chip.createSpan({ cls: "jev-tag-name", text: tag.name });
				if (tag.instructions) {
					nameEl.title = tag.instructions;
				}

				// Right: Toggle
				const toggleContainer = tagCard.createDiv({ cls: "jev-tag-card-toggle" });
				new Setting(toggleContainer).addToggle((toggle) => {
					toggle.setValue(tag.enabled).onChange(async (val) => {
						tags[index].enabled = val;
						tagCard.toggleClass("is-enabled", val);
						tagCard.toggleClass("is-disabled", !val);
						await this.plugin.saveSettings();

						const updatedEnabled = tags.filter((item) => item.enabled).length;
						statsEl.setText(
							t(lang, "settings.tagLibrary.stats", { total: totalTags, enabled: updatedEnabled })
						);
					});
				});
			});
		} else {
			// Empty state guidance card
			const emptyEl = containerEl.createDiv({ cls: "jev-tag-empty-state" });
			emptyEl.createEl("div", {
				cls: "jev-tag-empty-text",
				text: t(lang, "settings.tagLibrary.empty"),
			});
		}
	}
}
