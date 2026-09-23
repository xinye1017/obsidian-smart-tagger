import { App, PluginSettingTab, Setting } from "obsidian";
import type JevTaggerPlugin from "./main";
import type { TagDefinition } from "./jevClient";
import { BatchTagModal } from "./batchTagModal";

export interface JevTaggerSettings {
	apiKey: string;
	endpoint: string;
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

		containerEl.createEl("h2", { text: "Smart Tagger 设置" });
		containerEl.createEl("p", {
			text: "基于 TypeSafe Jev System-1 模型的毫秒级智能笔记标签推荐与全自动分类助手。",
			cls: "setting-item-description",
		});

		let keyInputEl: HTMLInputElement;
		let isRevealed = false;

		new Setting(containerEl)
			.setName("Jev API Key")
			.setDesc("你的 TypeSafe Jev 官方 API 密钥（输入后以密码密文遮罩保护）。")
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
					.setTooltip("切换显示/隐藏 API Key")
					.onClick(() => {
						isRevealed = !isRevealed;
						keyInputEl.type = isRevealed ? "text" : "password";
						btn.setIcon(isRevealed ? "eye" : "eye-off");
					});
			});

		new Setting(containerEl)
			.setName("置信度推荐阈值")
			.setDesc("仅推荐置信度大于等于该阈值的标签（默认 0.70，实测具备 95%~100% 极高准确度）。")
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
			.setName("自动继承父标签 #AI")
			.setDesc("当命中【异常检测】等具体 AI 子领域标签时，自动在 Frontmatter 追加父标签 #AI。")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoAddParentAiTag)
					.onChange(async (value) => {
						this.plugin.settings.autoAddParentAiTag = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "⚡ 快捷操作与全库维护" });

		new Setting(containerEl)
			.setName("全库笔记批量扫描与打标")
			.setDesc("打开全库批量打标面板，自动扫描整个知识库并为所有笔记添加高置信未添加标签。")
			.addButton((btn) =>
				btn
					.setButtonText("🚀 打开批量打标面板")
					.setCta()
					.onClick(() => {
						new BatchTagModal(this.app, this.plugin).open();
					})
			);

		new Setting(containerEl)
			.setName("自动检测并同步知识库标签库")
			.setDesc("自动扫描知识库当前已存在的所有历史标签，并将新发现的标签自动补充到下方的规则库中。")
			.addButton((btn) =>
				btn.setButtonText("🔍 扫描知识库标签").onClick(async () => {
					await this.plugin.detectAndSyncVaultTags();
					this.display();
				})
			);

		containerEl.createEl("h3", { text: "标签规则库 (Tag Criteria Library)" });
		containerEl.createEl("p", {
			text: "当前已配置的目标标签。可在右侧随时启用或关闭特定标签的自动评估。",
			cls: "setting-item-description",
		});

		this.plugin.settings.tags.forEach((tag, index) => {
			const tagContainer = containerEl.createDiv({ cls: "jev-setting-tag-box" });

			new Setting(tagContainer)
				.setName(`标签 #${tag.name}`)
				.setDesc(tag.instructions)
				.addToggle((toggle) =>
					toggle.setValue(tag.enabled).onChange(async (val) => {
						this.plugin.settings.tags[index].enabled = val;
						await this.plugin.saveSettings();
					})
				);
		});

		new Setting(containerEl)
			.setName("恢复默认验证规则库")
			.setDesc("将所有标签判定规则恢复为首发验证通过的 4 大基准定义（异常检测、社交媒体、资讯、AI）。")
			.addButton((btn) =>
				btn.setButtonText("恢复默认规则").onClick(async () => {
					this.plugin.settings.tags = JSON.parse(JSON.stringify(DEFAULT_TAG_DEFINITIONS));
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
