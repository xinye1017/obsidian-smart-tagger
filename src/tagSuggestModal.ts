import { App, Modal, Notice, TFile } from "obsidian";
import type { NoteEvaluationResult } from "./jevClient";
import type JevTaggerPlugin from "./main";

export class TagSuggestModal extends Modal {
	private plugin: JevTaggerPlugin;
	private file: TFile;
	private results: NoteEvaluationResult[];
	private existingTags: Set<string>;
	private isLoading: boolean;

	constructor(app: App, plugin: JevTaggerPlugin, file: TFile) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.results = [];
		this.existingTags = new Set();
		this.isLoading = true;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("jev-tagger-modal");

		// Header
		const header = contentEl.createDiv({ cls: "jev-tagger-header" });
		header.createEl("h3", { text: `🏷️ Smart Tagger: ${this.file.basename}` });
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: "正在向 Jev System-1 决策模型获取毫秒级标签置信度分析...",
		});

		// Loading indicator
		const loadingEl = contentEl.createDiv({ cls: "jev-loading-container" });
		loadingEl.createDiv({ cls: "jev-spinner" });
		loadingEl.createEl("span", { text: "AI 决策分析中..." });

		// Read existing frontmatter tags
		await this.readExistingTags();

		try {
			this.results = await this.plugin.evaluateFile(this.file);
			this.isLoading = false;
			this.renderResults();
		} catch (error) {
			loadingEl.empty();
			loadingEl.createEl("div", {
				cls: "setting-item-description",
				text: `❌ 分析失败: ${error.message || error}`,
			});
			new Notice(`Smart Tagger 预测出错: ${error.message || error}`);
		}
	}

	private async readExistingTags() {
		const cache = this.app.metadataCache.getFileCache(this.file);
		if (cache?.frontmatter?.tags) {
			const raw = cache.frontmatter.tags;
			if (Array.isArray(raw)) {
				raw.forEach((t) => this.existingTags.add(String(t).replace(/^#/, "")));
			} else if (typeof raw === "string") {
				raw.split(/[\s,]+/).forEach((t) => this.existingTags.add(t.replace(/^#/, "")));
			}
		}
	}

	private renderResults() {
		const { contentEl } = this;
		contentEl.empty();

		// Header
		const header = contentEl.createDiv({ cls: "jev-tagger-header" });
		header.createEl("h3", { text: `🏷️ Smart Tagger: ${this.file.basename}` });
		const thresholdPct = Math.round(this.plugin.settings.confidenceThreshold * 100);
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: `推荐置信度阈值 ≥ ${thresholdPct}%。点击按钮即可安全写入笔记 Frontmatter。`,
		});

		const tagList = contentEl.createDiv({ cls: "jev-tag-list" });

		if (this.results.length === 0) {
			tagList.createDiv({
				cls: "setting-item-description",
				text: "未检测到符合当前置信度阈值的标签。",
			});
		} else {
			this.results.forEach((res) => {
				const isExisting = this.existingTags.has(res.tagName);
				const isHighConf = res.probability >= this.plugin.settings.confidenceThreshold;

				const item = tagList.createDiv({ cls: "jev-tag-item" });

				// Left info
				const info = item.createDiv({ cls: "jev-tag-info" });
				const nameRow = info.createDiv({ cls: "jev-tag-name-row" });
				nameRow.createEl("span", { cls: "jev-tag-badge", text: `#${res.tagName}` });

				if (isExisting) {
					nameRow.createEl("span", { cls: "jev-tag-existing", text: "(已打标)" });
				}

				info.createEl("div", { cls: "jev-tag-desc", text: res.description });

				// Progress bar
				const progressContainer = info.createDiv({ cls: "jev-progress-bar-container" });
				const pct = Math.round(res.probability * 100);
				const fill = progressContainer.createDiv({ cls: "jev-progress-bar-fill" });
				fill.style.width = `${pct}%`;
				if (pct >= 80) fill.style.backgroundColor = "var(--color-green, #10b981)";
				else if (pct >= 60) fill.style.backgroundColor = "var(--color-blue, #3b82f6)";
				else fill.style.backgroundColor = "var(--color-yellow, #f59e0b)";

				// Right score and button
				const right = item.createDiv({ cls: "jev-tag-actions", attr: { style: "display: flex; align-items: center; gap: 10px;" } });
				right.createEl("span", { cls: "jev-confidence-score", text: `${pct}%` });

				if (!isExisting) {
					const addBtn = right.createEl("button", {
						cls: "mod-cta jev-btn-add",
						text: "+ 添加",
					});
					addBtn.onclick = async () => {
						await this.addTagToNote(res.tagName);
						this.existingTags.add(res.tagName);
						this.renderResults();
					};
				}
			});
		}

		// Footer actions
		const footer = contentEl.createDiv({ cls: "jev-actions-footer" });

		const highConfNewTags = this.results
			.filter((r) => r.probability >= this.plugin.settings.confidenceThreshold && !this.existingTags.has(r.tagName))
			.map((r) => r.tagName);

		if (highConfNewTags.length > 0) {
			const applyAllBtn = footer.createEl("button", {
				cls: "mod-cta",
				text: `⚡ 一键应用所有高置信标签 (${highConfNewTags.length}个)`,
			});
			applyAllBtn.onclick = async () => {
				for (const tag of highConfNewTags) {
					await this.addTagToNote(tag);
					this.existingTags.add(tag);
				}
				new Notice(`已成功添加 ${highConfNewTags.length} 个标签到 Frontmatter！`);
				this.close();
			};
		}

		const closeBtn = footer.createEl("button", { text: "关闭" });
		closeBtn.onclick = () => this.close();
	}

	private async addTagToNote(tagName: string) {
		await this.plugin.addTagToFile(this.file, tagName);
		new Notice(`已添加标签 #${tagName}`);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
