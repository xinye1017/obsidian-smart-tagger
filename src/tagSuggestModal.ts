import { App, Modal, Notice, TFile } from "obsidian";
import type { NoteEvaluationResult } from "./jevClient";
import type JevTaggerPlugin from "./main";
import { t, TranslationKey } from "./i18n";

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

	private tr(key: TranslationKey, params?: Record<string, string | number>): string {
		return t(this.plugin.settings.language, key, params);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("jev-tagger-modal");

		// Header
		const header = contentEl.createDiv({ cls: "jev-tagger-header" });
		header.createEl("h3", { text: this.tr("tagSuggest.title", { name: this.file.basename }) });
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: this.tr("tagSuggest.loadingSubtitle"),
		});

		// Loading indicator
		const loadingEl = contentEl.createDiv({ cls: "jev-loading-container" });
		loadingEl.createDiv({ cls: "jev-spinner" });
		loadingEl.createEl("span", { text: this.tr("tagSuggest.loading") });

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
				text: this.tr("tagSuggest.analysisFailed", { error: error.message || error }),
			});
			new Notice(this.tr("notice.predictFailed", { error: error.message || error }));
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
		header.createEl("h3", { text: this.tr("tagSuggest.title", { name: this.file.basename }) });
		const thresholdPct = Math.round(this.plugin.settings.confidenceThreshold * 100);
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: this.tr("tagSuggest.resultSubtitle", { threshold: thresholdPct }),
		});

		const tagList = contentEl.createDiv({ cls: "jev-tag-list" });

		if (this.results.length === 0) {
			tagList.createDiv({
				cls: "setting-item-description",
				text: this.tr("tagSuggest.empty"),
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
					nameRow.createEl("span", { cls: "jev-tag-existing", text: this.tr("tagSuggest.alreadyTagged") });
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
						text: this.tr("tagSuggest.addButton"),
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
				text: this.tr("tagSuggest.applyAllButton", { count: highConfNewTags.length }),
			});
			applyAllBtn.onclick = async () => {
				for (const tag of highConfNewTags) {
					await this.addTagToNote(tag);
					this.existingTags.add(tag);
				}
				new Notice(this.tr("notice.applyAllSuccess", { count: highConfNewTags.length }));
				this.close();
			};
		}

		const closeBtn = footer.createEl("button", { text: this.tr("tagSuggest.close") });
		closeBtn.onclick = () => this.close();
	}

	private async addTagToNote(tagName: string) {
		await this.plugin.addTagToFile(this.file, tagName);
		new Notice(this.tr("notice.tagAdded", { tag: tagName }));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
