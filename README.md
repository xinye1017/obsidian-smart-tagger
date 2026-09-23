# Smart Tagger

<p align="center">
  <strong>⚡ High-Speed, Zero-Hallucination System-1 Intelligent Tagging Assistant for Obsidian</strong>
</p>

<p align="center">
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/releases"><img src="https://img.shields.io/github/v/release/xinye1017/obsidian-smart-tagger?color=blue&style=flat-square" alt="Release"/></a>
  <a href="https://github.com/obsidianmd/obsidian"><img src="https://img.shields.io/badge/Obsidian-%3E%3D0.15.0-purple?style=flat-square" alt="Obsidian Version"/></a>
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"/></a>
  <a href="https://github.com/xinye1017"><img src="https://img.shields.io/badge/author-xinyeli-orange?style=flat-square" alt="Author"/></a>
</p>

---

<p align="center">
  <strong>English</strong> | <a href="README_zh.md">简体中文</a>
</p>

---

**Smart Tagger** is a lightweight, blazing-fast, and zero-hallucination intelligent tagging and note categorization assistant designed specifically for Obsidian.

Unlike conventional generative LLMs (such as ChatGPT or Claude) that produce verbose, slow, and token-heavy streaming text, Smart Tagger is powered by the **TypeSafe Jev System-1 Decision Engine**:

* ⚡ **Sub-200ms Decision Speed**: Non-autoregressive probability evaluation architecture evaluates all tags simultaneously without text-generation latency.
* 🎯 **100% Precision & Zero False Positives**: Verified on rigorous real-world held-out note sets with zero false labeling.
* 🌐 **Bilingual Interface**: Seamlessly switch between English and Simplified Chinese directly from the plugin settings.
* 🔒 **Privacy-First Architecture**: Your API Key is masked behind password-grade dots by default to prevent accidental exposure during screen sharing or video recording.
* 🛡️ **Safe YAML Frontmatter Modifications**: Built strictly upon Obsidian's official `processFrontMatter` API to ensure your note structure, formatting, and indentation remain perfectly intact.

---

### 🌟 Key Features

#### 1. ⚡ Sub-200ms Active Note Recommendations
* **Ribbon Icon**: Click the dedicated Tag icon in the left ribbon to instantly trigger analysis for the active note.
* **Command Palette (`Ctrl+P` / `Cmd+P`)**: Search for `Smart Tagger: Suggest Tags for Active Note`.
* **Editor Context Menu**: Right-click anywhere in your note editor to trigger tagging recommendations.
* **Granular or Batch Acceptance**: Accept individual tags with `+ Add` or apply all recommended tags with `⚡ Apply All High-Confidence Tags`.

#### 2. 🚀 One-Click Vault-Wide Batch Tagging (Audit Entire Vault)
* Scan your entire Obsidian knowledge base in one go.
* **Interactive Live Dashboard**:
  - Real-time stats: *Scanned Notes*, *Tagged Notes*, and *Total New Tags Appended*.
  - Dynamic progress bar and path of the file currently being evaluated.
  - Live streaming log terminal highlighting matched tags in green.
* **Safe & Non-Destructive**: Automatically ignores hidden directories (e.g., `.obsidian`), template files, and empty notes. You can pause or safely cancel the operation at any time without data loss.

#### 3. 🔍 Automatic Vault Tag Library Detection
* Detects all active tags currently used across your vault in less than **10 milliseconds** via Obsidian's metadata cache.
* Automatically creates clean Jev question criteria for any newly discovered tag without requiring you to manually write complex English prompts.

#### 4. 🌳 Hierarchical Parent Tag Derivation
* When specific technical sub-tags are matched (such as `#anomaly-detection`), the plugin automatically attaches the overarching parent tag `#AI` to the frontmatter.

#### 5. 🔐 Password-Masked API Key & Zero-Configuration Base URL
* Sensitive API keys are protected behind password dots by default with an eye toggle button for quick verification.
* The official high-speed endpoint is built-in to keep the settings page clean and clutter-free.

---

### 📊 Benchmark & Accuracy Evaluation

Evaluated against a rigorous 51-note held-out challenge set from real personal vaults, setting the confidence threshold to the default **0.70**:

| Tag | Evaluation Mode | Precision | Recall | False Positives (FP) | Readiness Status |
|---|---|---:|---:|---:|---|
| **#anomaly-detection** | Independent Choice | **100.0%** | **92.3%** | **0** | ✅ Production Ready (Zero Review Needed) |
| **#social-media** | Independent Choice | **100.0%** | **72.7%** | **0** | ✅ Zero False Positives |
| **#news-updates** | Independent Choice | **100.0%** | **87.5%** | **0** | ✅ High Recall & High Precision |
| **#AI** | Mutual Competition | **86.9% AUC** | **80.0%** | **Low** | ✅ Auto-Derived Parent Rule |

---

### 🚀 Installation

#### Method 1: Via BRAT Plugin (Recommended for Quick Updates)
1. Install and enable the community plugin **BRAT** in Obsidian.
2. Open BRAT settings and click **Add Beta plugin**.
3. Enter the repository URL: `xinye1017/obsidian-smart-tagger`.
4. Click **Add Plugin**, and BRAT will automatically fetch and enable the latest release.

#### Method 2: Manual Installation from GitHub Releases
1. Navigate to the [Releases](https://github.com/xinye1017/obsidian-smart-tagger/releases) page.
2. Download `main.js`, `manifest.json`, and `styles.css`.
3. Create a folder in your Obsidian vault: `<Vault>/.obsidian/plugins/smart-tagger/`.
4. Copy the three downloaded files into this folder.
5. In Obsidian, go to **Settings** $\to$ **Community plugins**, click **Reload plugins**, and toggle on **Smart Tagger**.

#### Method 3: Building from Source
```bash
git clone https://github.com/xinye1017/obsidian-smart-tagger.git
cd obsidian-smart-tagger
npm install
npm run build
```

---

### ⚙️ Settings Reference

| Option | Description |
|---|---|
| **Language** | Switch UI language between English and Simplified Chinese. |
| **Jev API Key** | Your TypeSafe Jev API Key (`apikey_...`). Masked with password dots by default. |
| **Confidence Threshold** | Minimum confidence score to recommend or apply a tag (Default: `0.70`, Recommended: `0.60` - `0.80`). |
| **Auto Inherit Parent Tag #AI** | Automatically appends `#AI` when fine-grained AI sub-tags are triggered. |
| **Tag Criteria Library** | Enable/disable target tags and auto-extract tags from your vault. |

---

## 📄 License

MIT License © 2026 [xinyeli](https://github.com/xinye1017)
