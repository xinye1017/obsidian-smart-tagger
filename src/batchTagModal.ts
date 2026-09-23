import { App, Modal, Notice, TFile } from "obsidian";
import type JevTaggerPlugin from "./main";

export class BatchTagModal extends Modal {
	private plugin: JevTaggerPlugin;
	private isRunning: boolean = false;
	private isCancelled: boolean = false;

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

	constructor(app: App, plugin: JevTaggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("jev-batch-modal");

		// Header
		const header = contentEl.createDiv({ cls: "jev-tagger-header" });
		header.createEl("h3", { text: "⚡ Smart Tagger: 全库批量扫描打标" });
		const thresholdPct = Math.round(this.plugin.settings.confidenceThreshold * 100);
		header.createEl("div", {
			cls: "jev-tagger-subtitle",
			text: `将全库扫描笔记，通过 Jev System-1 模型高速判定。若检测到置信度 ≥ ${thresholdPct}% 的未添加标签，将自动安全写入 Frontmatter。`,
		});

		// Stat Cards
		const statsContainer = contentEl.createDiv({ cls: "jev-batch-stats" });

		const stat1 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.processedStatEl = stat1.createDiv({ cls: "jev-stat-num", text: "0 / 0" });
		stat1.createDiv({ cls: "jev-stat-label", text: "已扫描笔记" });

		const stat2 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.modifiedStatEl = stat2.createDiv({ cls: "jev-stat-num", text: "0" });
		stat2.createDiv({ cls: "jev-stat-label", text: "命中打标笔记" });

		const stat3 = statsContainer.createDiv({ cls: "jev-stat-card" });
		this.addedTagsStatEl = stat3.createDiv({ cls: "jev-stat-num", text: "0" });
		stat3.createDiv({ cls: "jev-stat-label", text: "累计新增标签" });

		// Current file status
		this.currentFileEl = contentEl.createDiv({
			cls: "jev-batch-current-file",
			text: "准备就绪，点击下方按钮开始。",
		});

		// Progress Bar
		const progressContainer = contentEl.createDiv({ cls: "jev-progress-bar-container" });
		this.progressFillEl = progressContainer.createDiv({ cls: "jev-progress-bar-fill" });
		this.progressFillEl.style.width = "0%";

		// Log terminal
		contentEl.createEl("div", {
			text: "执行日志:",
			cls: "setting-item-description",
			attr: { style: "margin: 12px 0 4px 0;" },
		});
		this.logContainerEl = contentEl.createDiv({ cls: "jev-batch-log" });
		this.addLog("点击 [开始批量打标] 即刻启动后台高速评估...", "jev-log-skip");

		// Footer buttons
		const footer = contentEl.createDiv({ cls: "jev-actions-footer" });

		this.startBtn = footer.createEl("button", {
			cls: "mod-cta",
			text: "🚀 开始全库批量打标",
		});
		this.startBtn.onclick = () => this.startBatchProcess();

		this.cancelBtn = footer.createEl("button", { text: "关闭" });
		this.cancelBtn.onclick = () => {
			if (this.isRunning) {
				this.isCancelled = true;
				this.cancelBtn.setText("正在停止...");
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

		const files = this.app.vault.getMarkdownFiles().filter((f) => {
			const p = f.path;
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
		this.cancelBtn.setText("⏹️ 停止扫描");

		this.addLog(`开始全库批量分析，目标 Markdown 笔记: ${this.totalFiles} 篇`, "jev-log-skip");

		for (let idx = 0; idx < files.length; idx++) {
			if (this.isCancelled) {
				this.addLog("用户主动中止了批量打标。", "jev-log-skip");
				break;
			}

			const file = files[idx];
			this.currentFileEl.setText(`正在分析 (${idx + 1}/${this.totalFiles}): ${file.path}`);
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
						this.addLog(`✅ [${file.basename}] 新增标签: ${tagNames}`, "jev-log-success");
					}
				} else {
					// No new tags
					// this.addLog(`跳过 [${file.basename}]：无新高置信标签`, "jev-log-skip");
				}
			} catch (err) {
				this.addLog(`❌ [${file.basename}] 错误: ${err.message || err}`, "jev-log-skip");
			}

			this.processedCount = idx + 1;
			this.processedStatEl.setText(`${this.processedCount} / ${this.totalFiles}`);
			this.modifiedStatEl.setText(`${this.modifiedFilesCount}`);
			this.addedTagsStatEl.setText(`${this.addedTagsCount}`);

			// Gentle interval to avoid API burst
			await new Promise((res) => setTimeout(res, 80));
		}

		this.isRunning = false;
		this.currentFileEl.setText("🎉 批量打标全部完成！");
		this.progressFillEl.style.width = "100%";
		this.cancelBtn.setText("完成关闭");
		this.cancelBtn.disabled = false;
		this.startBtn.setText("重新扫描");
		this.startBtn.disabled = false;

		new Notice(`全库打标完成！扫描 ${this.processedCount} 篇笔记，为 ${this.modifiedFilesCount} 篇笔记追加了 ${this.addedTagsCount} 个新标签。`);
	}

	onClose() {
		this.isCancelled = true;
		const { contentEl } = this;
		contentEl.empty();
	}
}
