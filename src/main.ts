import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { JevClient, NoteEvaluationResult } from "./jevClient";
import { DEFAULT_SETTINGS, JevTaggerSettings, JevTaggerSettingTab } from "./settings";
import { TagSuggestModal } from "./tagSuggestModal";
import { BatchTagModal } from "./batchTagModal";
import { t, TranslationKey } from "./i18n";

const LEGACY_DEFAULT_TAG_RULES = [
	{
		name: "异常检测",
		instructions: "Is this note primarily about image anomaly detection or anomaly segmentation?",
		matchCriteria: "Computer vision anomaly detection, defect localization, and benchmark experiments.",
		otherCriteria: "General database schemas, web engineering, reading lists, or thesis checklists.",
	},
	{
		name: "社交媒体",
		instructions: "Is this note primarily about social media, creator accounts, or tweets?",
		matchCriteria: "Social platforms, creator profiles, tweet drafts, or audience growth.",
		otherCriteria: "Machine learning research, backend coding, or internal project planning.",
	},
	{
		name: "资讯",
		instructions: "Does this note primarily record recent news, announcements, or industry developments?",
		matchCriteria: "The note reports or aggregates external news, model releases, company updates, or daily roundups.",
		otherCriteria: "An evergreen tutorial, research explanation, personal plan, or general design document.",
	},
	{
		name: "AI",
		instructions: "Is this note primarily about artificial intelligence models, AI agents, or AI tools?",
		matchCriteria: "Artificial intelligence models, AI agents, LLM prompting, or AI tools.",
		otherCriteria: "General software development, database administration, UI styling, or personal notes.",
	},
];

export default class JevTaggerPlugin extends Plugin {
	settings: JevTaggerSettings;
	jevClient: JevClient;

	private tr(key: TranslationKey, params?: Record<string, string | number>): string {
		return t(this.settings.language, key, params);
	}

	async onload() {
		await this.loadSettings();
		this.jevClient = new JevClient(this.settings.apiKey, this.settings.endpoint);

		// Add Ribbon Icon on the left bar
		this.addRibbonIcon("tags", this.tr("plugin.ribbon"), (evt: MouseEvent) => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				new TagSuggestModal(this.app, this, activeFile).open();
			} else {
				new Notice(this.tr("notice.noActiveFile"));
			}
		});

		// Add Command: Open Suggestion Modal
		this.addCommand({
			id: "jev-suggest-tags",
			name: this.tr("command.suggestTags"),
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
			name: this.tr("command.autoApply"),
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
			name: this.tr("command.batchTagAll"),
			callback: () => {
				new BatchTagModal(this.app, this).open();
			},
		});

		// Add Command: Detect and Sync Vault Tags
		this.addCommand({
			id: "jev-sync-vault-tags",
			name: this.tr("command.syncVaultTags"),
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
							.setTitle(this.tr("menu.suggestTags"))
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
		const savedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);

		// Remove unchanged built-in rules from older versions while preserving custom rules.
		if (Array.isArray(savedData?.tags)) {
			const filteredTags = this.settings.tags.filter(
				(tag) =>
					!LEGACY_DEFAULT_TAG_RULES.some(
						(rule) =>
							tag.name === rule.name &&
							tag.instructions === rule.instructions &&
							tag.matchCriteria === rule.matchCriteria &&
							tag.otherCriteria === rule.otherCriteria
					)
			);
			if (filteredTags.length !== this.settings.tags.length) {
				this.settings.tags = filteredTags;
				await this.saveData(this.settings);
			}
		}
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
		new Notice(this.tr("notice.analyzing", { name: file.basename }));
		try {
			const results = await this.evaluateFile(file);
			const eligible = results.filter((r) => r.probability >= this.settings.confidenceThreshold);

			if (eligible.length === 0) {
				new Notice(
					this.tr("notice.noEligibleTags", {
						threshold: Math.round(this.settings.confidenceThreshold * 100),
					})
				);
				return;
			}

			let addedCount = 0;
			for (const res of eligible) {
				const added = await this.addTagToFile(file, res.tagName);
				if (added) addedCount++;
			}

			if (addedCount > 0) {
				new Notice(this.tr("notice.autoApplySuccess", { count: addedCount }));
			} else {
				new Notice(this.tr("notice.tagsAlreadyExist"));
			}
		} catch (e) {
			new Notice(this.tr("notice.autoApplyFailed", { error: e.message || e }));
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
			new Notice(this.tr("notice.noVaultTags"));
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
		new Notice(this.tr("notice.vaultTagsSynced", { total: sortedTags.length, added: addedCount }));
		return { added: addedCount, total: sortedTags.length };
	}
}

