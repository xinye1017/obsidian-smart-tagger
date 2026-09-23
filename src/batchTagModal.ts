import { App, Modal, Notice, Setting, TFile, TFolder } from "obsidian";
import type JevTaggerPlugin from "./main";
import { t, TranslationKey } from "./i18n";

export class BatchTagModal extends Modal {
	private plugin: JevTaggerPlugin;
	private isRunning: boolean = false;
	private isCancelled: boolean = false;
	private selectedFolderPath = "";

	// Metrics
	private totalFiles: number = 0;
	private processedCount: number = 0;
	private modifiedFilesCount: number = 0;
	private addedTagsCount: number = 0;

	// UI Elements
	private progressFillEl: HTMLElement;
	private currentFileEl: HTMLElement;
	private processedStatEl: HTMLElement;
	private modifiedStatEl: HTMLElement;
	private addedTagsStatEl: HTMLElement;
	private logContainerEl: HTMLElement;
	private startBtn: HTMLButtonElement;
	private cancelBtn: HTMLButtonElement;
	private scopeSelectEl: HTMLSelectElement;

	constructor(app: App, plugin: JevTaggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	private tr(key: TranslationKey, params?: Record<string, string | number>): string {
		return t(this.plugin.settings.language, key, params);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("jev-batch-modal");

		// Header
		const header = contentEl.createDiv({ cls: "jev-tagger-header" });
		header.createEl("h3", { text: this.tr("batch.title") });
		const thresholdPct = Math.round(this.plugin.settings.confidenceThreshold * 100);
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: this.tr("batch.subtitle", { threshold: thresholdPct }),
		});

		const folderPaths = this.app.vault
			.getAllLoadedFiles()
			.filter((file) => file instanceof TFolder && file.path.length > 0)
			.map((folder) => folder.path)
			.sort((a, b) => a.localeCompare(b));
		if (this.selectedFolderPath && !folderPaths.includes(this.selectedFolderPath)) {
			this.selectedFolderPath = "";
		}
		new Setting(contentEl)
			.setName(this.tr("batch.scopeLabel"))
			.setDesc(this.tr("batch.scopeDesc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("", this.tr("batch.scopeAll"));
				folderPaths.forEach((path) => dropdown.addOption(path, path));
				dropdown.setValue(this.selectedFolderPath).onChange((path) => {
					this.selectedFolderPath = path;
				});
				this.scopeSelectEl = dropdown.selectEl;
			});

		// Stat Cards
		const statsContainer = contentEl.createDiv({ cls: "jev-batch-stats" });

		const stat1 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.processedStatEl = stat1.createDiv({ cls: "jev-stat-num", text: "0 / 0" });
		stat1.createDiv({ cls: "jev-stat-label", text: this.tr("batch.statScanned") });

		const stat2 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.modifiedStatEl = stat2.createDiv({ cls: "jev-stat-num", text: "0" });
		stat2.createDiv({ cls: "jev-stat-label", text: this.tr("batch.statModified") });

		const stat3 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.addedTagsStatEl = stat3.createDiv({ cls: "jev-stat-num", text: "0" });
		stat3.createDiv({ cls: "jev-stat-label", text: this.tr("batch.statAdded") });

		// Current file status
		this.currentFileEl = contentEl.createDiv({
			cls: "jev-batch-current-file",
			text: this.tr("batch.ready"),
		});

		// Progress Bar
		const progressContainer = contentEl.createDiv({ cls: "jev-progress-bar-container" });
		this.progressFillEl = progressContainer.createDiv({ cls: "jev-progress-bar-fill" });
		this.progressFillEl.style.width = "0%";

		// Log terminal
		contentEl.createEl("div", {
			text: this.tr("batch.logHeader"),
			cls: "setting-item-description",
			attr: { style: "margin: 12px 0 4px 0;" },
		});
		this.logContainerEl = contentEl.createDiv({ cls: "jev-batch-log" });
		this.addLog(this.tr("batch.startHint"), "jev-log-skip");

		// Footer buttons
		const footer = contentEl.createDiv({ cls: "jev-actions-footer" });

		this.startBtn = footer.createEl("button", {
			cls: "mod-cta",
			text: this.tr("batch.startButton"),
		});
		this.startBtn.onclick = () => this.startBatchProcess();

		this.cancelBtn = footer.createEl("button", { text: this.tr("batch.close") });
		this.cancelBtn.onclick = () => {
			if (this.isRunning) {
				this.isCancelled = true;
				this.cancelBtn.setText(this.tr("batch.stopping"));
				this.cancelBtn.disabled = true;
			} else {
				this.close();
			}
		};
	}

	private addLog(text: string, cls: string = "jev-log-skip") {
		const item = this.logContainerEl.createDiv({ cls: `jev-log-item ${cls}`, text });
		this.logContainerEl.scrollTop = this.logContainerEl.scrollHeight;
	}

	private async startBatchProcess() {
		if (this.isRunning) return;
		const selectedFolderPath = this.selectedFolderPath;

		const files = this.app.vault.getMarkdownFiles().filter((f) => {
			const p = f.path;
			if (selectedFolderPath && !p.startsWith(`${selectedFolderPath}/`)) return false;
			// Filter hidden or system templates
			if (p.startsWith(".") || p.includes("/.") || p.includes("\\.")) return false;
			if (p.toLowerCase().includes("templates") || p.toLowerCase().includes("模板")) return false;
			return true;
		});

		this.totalFiles = files.length;
		this.processedCount = 0;
		this.modifiedFilesCount = 0;
		this.addedTagsCount = 0;
		this.isRunning = true;
		this.isCancelled = false;

		this.startBtn.disabled = true;
		this.scopeSelectEl.disabled = true;
		this.cancelBtn.setText(this.tr("batch.stopButton"));

		this.addLog(
			this.tr("batch.logStart", {
				scope: selectedFolderPath || this.tr("batch.scopeAll"),
				total: this.totalFiles,
			}),
			"jev-log-skip"
		);

		for (let idx = 0; idx < files.length; idx++) {
			if (this.isCancelled) {
				this.addLog(this.tr("batch.logCancelled"), "jev-log-skip");
				break;
			}

			const file = files[idx];
			this.currentFileEl.setText(
				this.tr("batch.logCurrentFile", { index: idx + 1, total: this.totalFiles, path: file.path })
			);
			const pct = Math.round(((idx + 1) / this.totalFiles) * 100);
			this.progressFillEl.style.width = `${pct}%`;

			try {
				const results = await this.plugin.evaluateFile(file);
				const eligible = results.filter((r) => r.probability >= this.plugin.settings.confidenceThreshold);

				// Read existing tags
				const cache = this.app.metadataCache.getFileCache(file);
				const existingTags = new Set<string>();
				if (cache?.frontmatter?.tags) {
					const raw = cache.frontmatter.tags;
					if (Array.isArray(raw)) raw.forEach((t) => existingTags.add(String(t).replace(/^#/, "")));
					else if (typeof raw === "string") raw.split(/[\s,]+/).forEach((t) => existingTags.add(t.replace(/^#/, "")));
				}

				const toAdd = eligible.filter((r) => !existingTags.has(r.tagName));

				if (toAdd.length > 0) {
					let fileModified = false;
					for (const item of toAdd) {
						const added = await this.plugin.addTagToFile(file, item.tagName);
						if (added) {
							this.addedTagsCount++;
							fileModified = true;
						}
					}
					if (fileModified) {
						this.modifiedFilesCount++;
						const tagNames = toAdd.map((t) => `#${t.tagName}`).join(", ");
						this.addLog(this.tr("batch.logAddedTags", { name: file.basename, tags: tagNames }), "jev-log-success");
					}
				} else {
					// No new tags
					// this.addLog(`跳过 [${file.basename}]：无新高置信标签`, "jev-log-skip");
				}
			} catch (err) {
				this.addLog(this.tr("batch.logError", { name: file.basename, error: err.message || err }), "jev-log-skip");
			}

			this.processedCount = idx + 1;
			this.processedStatEl.setText(`${this.processedCount} / ${this.totalFiles}`);
			this.modifiedStatEl.setText(`${this.modifiedFilesCount}`);
			this.addedTagsStatEl.setText(`${this.addedTagsCount}`);

			// Gentle interval to avoid API burst
			await new Promise((res) => setTimeout(res, 80));
		}

		this.isRunning = false;
		this.currentFileEl.setText(this.tr("batch.allDone"));
		this.progressFillEl.style.width = "100%";
		this.cancelBtn.setText(this.tr("batch.finishedButton"));
		this.cancelBtn.disabled = false;
		this.startBtn.setText(this.tr("batch.rescanButton"));
		this.startBtn.disabled = false;
		this.scopeSelectEl.disabled = false;

		new Notice(
			this.tr("notice.batchComplete", {
				scanned: this.processedCount,
				modified: this.modifiedFilesCount,
				added: this.addedTagsCount,
			})
		);
	}

	onClose() {
		this.isCancelled = true;
		const { contentEl } = this;
		contentEl.empty();
	}
}
