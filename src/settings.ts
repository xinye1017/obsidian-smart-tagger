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
	autoAddParentAiTag: boolean; // Automatic derivation rule: add #AI if specific AI sub-tag matched
	tags: TagDefinition[];
}

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
	{
		name: "异常检测",
		instructions: "Is this note primarily about image anomaly detection or anomaly segmentation?",
		matchCriteria: "Computer vision anomaly detection, defect localization, and benchmark experiments.",
		otherCriteria: "General database schemas, web engineering, reading lists, or thesis checklists.",
		enabled: true,
	},
	{
		name: "社交媒体",
		instructions: "Is this note primarily about social media, creator accounts, or tweets?",
		matchCriteria: "Social platforms, creator profiles, tweet drafts, or audience growth.",
		otherCriteria: "Machine learning research, backend coding, or internal project planning.",
		enabled: true,
	},
	{
		name: "资讯",
		instructions: "Does this note primarily record recent news, announcements, or industry developments?",
		matchCriteria: "The note reports or aggregates external news, model releases, company updates, or daily roundups.",
		otherCriteria: "An evergreen tutorial, research explanation, personal plan, or general design document.",
		enabled: true,
	},
	{
		name: "AI",
		instructions: "Is this note primarily about artificial intelligence models, AI agents, or AI tools?",
		matchCriteria: "Artificial intelligence models, AI agents, LLM prompting, or AI tools.",
		otherCriteria: "General software development, database administration, UI styling, or personal notes.",
		enabled: true,
	},
];

export const DEFAULT_SETTINGS: JevTaggerSettings = {
	apiKey: "",
	endpoint: "https://api.typesafe.ai/v1/systemone",
	language: "zh",
	confidenceThreshold: 0.70,
	autoAddParentAiTag: true,
	tags: DEFAULT_TAG_DEFINITIONS,
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

		const lang = this.plugin.settings.language;

		containerEl.createEl("h2", { text: t(lang, "settings.title") });
		containerEl.createEl("p", {
			text: t(lang, "settings.subtitle"),
			cls: "setting-item-description",
		});

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

		let keyInputEl: HTMLInputElement;
		let isRevealed = false;

		new Setting(containerEl)
			.setName(t(lang, "settings.apiKey.name"))
			.setDesc(t(lang, "settings.apiKey.desc"))
			.addText((text) => {
				keyInputEl = text.inputEl;
				keyInputEl.type = "password";
				keyInputEl.placeholder = "apikey_...";
				text.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
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

		new Setting(containerEl)
			.setName(t(lang, "settings.threshold.name"))
			.setDesc(t(lang, "settings.threshold.desc"))
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 0.95, 0.05)
					.setValue(this.plugin.settings.confidenceThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.confidenceThreshold = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t(lang, "settings.parentTag.name"))
			.setDesc(t(lang, "settings.parentTag.desc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoAddParentAiTag)
					.onChange(async (value) => {
						this.plugin.settings.autoAddParentAiTag = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: t(lang, "settings.quickActions.title") });

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

		containerEl.createEl("h3", { text: t(lang, "settings.tagLibrary.title") });
		containerEl.createEl("p", {
			text: t(lang, "settings.tagLibrary.desc"),
			cls: "setting-item-description",
		});

		this.plugin.settings.tags.forEach((tag, index) => {
			const tagContainer = containerEl.createDiv({ cls: "jev-setting-tag-box" });

			new Setting(tagContainer)
				.setName(t(lang, "settings.tagLibrary.tagName", { name: tag.name }))
				.setDesc(tag.instructions)
				.addToggle((toggle) =>
					toggle.setValue(tag.enabled).onChange(async (val) => {
						this.plugin.settings.tags[index].enabled = val;
						await this.plugin.saveSettings();
					})
				);
		});

		new Setting(containerEl)
			.setName(t(lang, "settings.reset.name"))
			.setDesc(t(lang, "settings.reset.desc"))
			.addButton((btn) =>
				btn.setButtonText(t(lang, "settings.reset.button")).onClick(async () => {
					this.plugin.settings.tags = JSON.parse(JSON.stringify(DEFAULT_TAG_DEFINITIONS));
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
