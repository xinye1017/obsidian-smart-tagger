import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { JevClient, NoteEvaluationResult } from "./jevClient";
import { DEFAULT_SETTINGS, JevTaggerSettings, JevTaggerSettingTab } from "./settings";
import { TagSuggestModal } from "./tagSuggestModal";
import { BatchTagModal } from "./batchTagModal";

export default class JevTaggerPlugin extends Plugin {
	settings: JevTaggerSettings;
	jevClient: JevClient;

	async onload() {
		await this.loadSettings();
		this.jevClient = new JevClient(this.settings.apiKey, this.settings.endpoint);

		// Add Ribbon Icon on the left bar
		this.addRibbonIcon("tags", "Smart Tagger: 智能标签推荐", (evt: MouseEvent) => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				new TagSuggestModal(this.app, this, activeFile).open();
			} else {
				new Notice("请先在编辑器中打开一篇笔记。");
			}
		});

		// Add Command: Open Suggestion Modal
		this.addCommand({
			id: "jev-suggest-tags",
			name: "为当前活动笔记推荐标签 (Suggest Tags for Active Note)",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						new TagSuggestModal(this.app, this, activeFile).open();
					}
					return true;
				}
				return false;
			},
		});

		// Add Command: Quick Auto-Apply High-Confidence Tags
		this.addCommand({
			id: "jev-auto-apply-tags",
			name: "一键自动应用高置信标签到当前笔记 (Auto-apply Tags to Active Note)",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.autoApplyTags(activeFile);
					}
					return true;
				}
				return false;
			},
		});

		// Add Command: Batch Tag All Notes
		this.addCommand({
			id: "jev-batch-tag-all",
			name: "一键为所有笔记扫描并添加高置信标签 (Batch Tag All Notes in Vault)",
			callback: () => {
				new BatchTagModal(this.app, this).open();
			},
		});

		// Add Command: Detect and Sync Vault Tags
		this.addCommand({
			id: "jev-sync-vault-tags",
			name: "自动检测并同步知识库标签库 (Detect and Sync Vault Tags)",
			callback: async () => {
				await this.detectAndSyncVaultTags();
			},
		});

		// Add Context Menu Item
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile && file.extension === "md") {
					menu.addItem((item) => {
						item
							.setTitle("Smart Tagger: 智能标签推荐")
							.setIcon("tags")
							.onClick(() => {
								new TagSuggestModal(this.app, this, file).open();
							});
					});
				}
			})
		);

		// Add Settings Tab
		this.addSettingTab(new JevTaggerSettingTab(this.app, this));
		console.log("Smart Tagger plugin loaded.");
	}

	onunload() {
		console.log("Smart Tagger plugin unloaded.");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		if (this.jevClient) {
			this.jevClient.setApiKey(this.settings.apiKey);
		}
	}

	/**
	 * Extracts clean state for Jev System-1 model evaluation
	 */
	public async buildNoteState(file: TFile): Promise<Record<string, any>> {
		const rawContent = await this.app.vault.read(file);

		// Strip existing YAML frontmatter
		let text = rawContent.replace(/^---[\s\S]*?---\s*/, "");
		// Strip inline tags like #tag
		text = text.replace(/(^|\s)#[^\s#]+/g, "$1").trim();

		const title = file.basename;
		const introduction = text.slice(0, 450);

		// Extract top headings
		const headings: string[] = [];
		const headingMatches = text.match(/^#{1,4}\s+(.+)$/gm);
		if (headingMatches) {
			for (const h of headingMatches.slice(0, 8)) {
				headings.push(h.replace(/^#{1,4}\s+/, "").trim());
			}
		}

		// Representative excerpt
		let excerpt = "";
		if (text.length > 700) {
			excerpt = text.slice(-260);
		}

		const state: Record<string, any> = {
			title: title,
			headings: headings,
			content_start: introduction,
			content_excerpt: excerpt,
		};

		// Short note context enhancement
		if (text.length < 300) {
			const folder = file.parent ? file.parent.path : "";
			state["folder_context"] = `Folder location: ${folder}`;
		}

		return state;
	}

	/**
	 * Calls Jev to evaluate the note against enabled tags
	 */
	public async evaluateFile(file: TFile): Promise<NoteEvaluationResult[]> {
		const state = await this.buildNoteState(file);
		return await this.jevClient.evaluateNote(state, this.settings.tags);
	}

	/**
	 * Auto applies tags that meet the threshold
	 */
	public async autoApplyTags(file: TFile) {
		new Notice(`Jev 正在分析笔记: ${file.basename}...`);
		try {
			const results = await this.evaluateFile(file);
			const eligible = results.filter((r) => r.probability >= this.settings.confidenceThreshold);

			if (eligible.length === 0) {
				new Notice(`未检测到置信度 ≥ ${Math.round(this.settings.confidenceThreshold * 100)}% 的新标签。`);
				return;
			}

			let addedCount = 0;
			for (const res of eligible) {
				const added = await this.addTagToFile(file, res.tagName);
				if (added) addedCount++;
			}

			if (addedCount > 0) {
				new Notice(`已成功自动追加 ${addedCount} 个高置信标签！`);
			} else {
				new Notice(`相关标签均已存在于笔记中。`);
			}
		} catch (e) {
			new Notice(`自动打标失败: ${e.message || e}`);
		}
	}

	/**
	 * Safely adds tag to frontmatter using Obsidian's processFrontMatter API
	 */
	public async addTagToFile(file: TFile, newTag: string): Promise<boolean> {
		let modified = false;

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			let currentTags: string[] = [];
			if (frontmatter.tags) {
				if (Array.isArray(frontmatter.tags)) {
					currentTags = frontmatter.tags.map((t) => String(t).replace(/^#/, ""));
				} else if (typeof frontmatter.tags === "string") {
					currentTags = frontmatter.tags.split(/[\s,]+/).map((t) => t.replace(/^#/, ""));
				}
			}

			if (!currentTags.includes(newTag)) {
				currentTags.push(newTag);
				modified = true;
			}

			// Parent AI derivation rule
			if (
				this.settings.autoAddParentAiTag &&
				(newTag === "异常检测" || newTag === "Agent" || newTag === "模型") &&
				!currentTags.includes("AI")
			) {
				currentTags.push("AI");
				modified = true;
			}

			frontmatter.tags = currentTags;
		});

		return modified;
	}

	/**
	 * Detects all tags present in the current Obsidian Vault using metadataCache
	 * and syncs them into the plugin's tag library.
	 */
	public async detectAndSyncVaultTags(): Promise<{ added: number; total: number }> {
		const allTagsMap = this.app.metadataCache.getTags();
		const tagKeys = Object.keys(allTagsMap);

		if (tagKeys.length === 0) {
			new Notice("未在知识库中检测到已有标签。");
			return { added: 0, total: 0 };
		}

		let addedCount = 0;
		const existingNames = new Set(this.settings.tags.map((t) => t.name));

		// Sort by usage count desc
		const sortedTags = tagKeys
			.map((rawTag) => ({
				name: rawTag.replace(/^#/, "").trim(),
				count: allTagsMap[rawTag],
			}))
			.filter((t) => t.name.length > 0 && !t.name.includes("/"))
			.sort((a, b) => b.count - a.count);

		for (const t of sortedTags) {
			if (!existingNames.has(t.name)) {
				this.settings.tags.push({
					name: t.name,
					instructions: `Is this note primarily about ${t.name}?`,
					matchCriteria: `${t.name} and related topics.`,
					otherCriteria: "Other topics.",
					enabled: true,
				});
				existingNames.add(t.name);
				addedCount++;
			}
		}

		await this.saveSettings();
		new Notice(`🏷️ 标签库检测完成！共扫描到 ${sortedTags.length} 个已有标签，自动新发现并同步 ${addedCount} 个新标签至规则库！`);
		return { added: addedCount, total: sortedTags.length };
	}
}

