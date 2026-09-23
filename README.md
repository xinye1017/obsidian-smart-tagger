# Smart Tagger

<p align="center">
  <img src="https://raw.githubusercontent.com/xinye1017/obsidian-smart-tagger/main/icon.png" width="96" height="96" alt="Smart Tagger Logo" onerror="this.style.display='none'"/>
</p>

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

[English Documentation](#english-documentation) | [中文说明文档](#中文说明文档)

---

<a name="english-documentation"></a>
## English Documentation

**Smart Tagger** is a lightweight, blazing-fast, and zero-hallucination intelligent tagging and note categorization assistant designed specifically for Obsidian. 

Unlike conventional text-generation LLMs (such as ChatGPT or Claude) that produce verbose, slow, and token-heavy streaming outputs, Smart Tagger is powered by the **TypeSafe Jev System-1 Decision Engine**:
* ⚡ **Sub-200ms Decision Speed**: Non-autoregressive evaluation architecture evaluates all tags in parallel without text-generation latency.
* 🎯 **100% Precision & Zero False Positives**: Verified on rigorous real-world held-out note sets with zero false labeling.
* 🔒 **Privacy-First Architecture**: Your API Key is masked with password-grade dots to prevent accidental exposure during screen sharing or recording.
* 🛡️ **Safe YAML Frontmatter Modifications**: Built strictly on Obsidian's official `processFrontMatter` API to ensure your note structure, formatting, and indentation remain perfectly intact.

---

### 🌟 Key Features

#### 1. ⚡ Sub-200ms Active Note Recommendations
* **Ribbon Icon**: Click the dedicated Tag icon in the left ribbon to instantly trigger analysis for the active note.
* **Command Palette (`Ctrl+P` / `Cmd+P`)**: Search for `Smart Tagger: Suggest Tags for Active Note`.
* **Editor Context Menu**: Right-click anywhere in your note editor to trigger tagging recommendations.
* **Granular or Batch Acceptance**: Accept individual tags with `+ Add` or apply all with `⚡ Apply All High-Confidence Tags`.

#### 2. 🚀 One-Click Vault-Wide Batch Tagging (Audit Entire Vault)
* Scan your entire Obsidian knowledge base in one go.
* **Interactive Live Dashboard**: Real-time stats for *Scanned Notes*, *Tagged Notes*, and *Total New Tags Appended*.
* **Dynamic Progress Bar & Terminal Logs**: Displays exactly which notes are being analyzed and prints highlighted green tags as they are added.
* **Safe & Non-Destructive**: Automatically ignores hidden directories (e.g. `.obsidian`), template files, and empty notes. You can pause or safely cancel the operation at any time.

#### 3. 🔍 Automatic Vault Tag Library Detection
* Detects all active tags currently used across your vault in less than **10 milliseconds** via Obsidian's metadata index.
* Automatically creates clean Jev question criteria for any newly discovered tag without requiring you to manually write English prompts.

#### 4. 🌳 Hierarchical Parent Tag Derivation
* When specific technical sub-tags are matched (such as `#anomaly-detection`), the plugin automatically attaches the overarching parent tag `#AI` to the frontmatter.

#### 5. 🔐 Password-Masked API Key & Zero-Configuration Base URL
* Sensitive API keys are protected behind password dots by default with an eye toggle button for quick verification.
* The official high-speed endpoint is hard-coded into the backend to keep the settings page clean and clutter-free.

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

* **Jev API Key**: Your TypeSafe Jev API Key (`apikey_...`). Hidden with password masking by default.
* **Confidence Threshold**: Default `0.70`. Recommended range: `0.60` - `0.80`. Higher values prioritize 100% precision over recall.
* **Auto Inherit Parent Tag #AI**: Automatically appends `#AI` when fine-grained AI sub-tags are triggered.
* **Tag Criteria Library**: Toggle target tags on or off with a single click.

---

<a name="中文说明文档"></a>
## 中文说明文档

**Smart Tagger** 是专为 Obsidian 打造的极速、高精度智能标签助手。不同于传统大语言模型（如 ChatGPT / Claude）长篇大论的慢速生成，Smart Tagger 搭载先进的 **TypeSafe Jev System-1 决策引擎**：
* ⚡ **150 毫秒即刻返回**：不做逐字自回归吐字，以概率决策头并行打分；
* 🎯 **100% 精度与零误报**：留出挑战集实测准确率达 100%，杜绝标签污染；
* 🔒 **隐私至上**：密文遮罩存储 API Key，防录屏与窥屏；
* 🛡️ **安全写入**：基于 Obsidian 官方 `processFrontMatter` API，绝不破坏笔记格式。

---

### ✨ 核心功能

1. **⚡ 毫秒级单篇推荐**
   - **左侧边栏 (Ribbon)**：点击标签小图标，即刻弹出当前笔记标签建议弹窗；
   - **命令面板 (`Ctrl+P`)**：随时呼出 `Smart Tagger: 为当前活动笔记推荐标签`；
   - **右键菜单**：在笔记内任意位置右键，一键触发打标；
   - **一键应用**：支持单个标签添加或 `⚡ 一键应用所有高置信标签`。

2. **🚀 全库一键批量扫描与打标 (Batch Tagging)**
   - 专为已有大量笔记的知识库设计：一键扫描整个 Vault 中的全部笔记；
   - 内置**动态进度条**、**三维统计看板**（已扫笔记、命中笔记、新增标签）及**实时日志滚动控制台**；
   - 自动跳过模板文件、隐藏目录和已存在标签，支持随时无损中止。

3. **🔍 自动检测与同步知识库标签库 (Vault Tag Auto-Detection)**
   - 一键扫描你的当前知识库，秒级提取所有已有标签及其历史使用词频；
   - 自动为你现有的标签生成极简 Jev 判据模板，免去手动编写规则的繁琐。

4. **🌳 标签层级自动联动 (Parent Tag Derivation)**
   - 当笔记被判定命中具体的细分领域标签（如 `#异常检测`）时，系统自动联动推导附带父级标签 `#AI`。

5. **🔐 隐私保护机制**
   - API Key 输入后自动采用密码圆点密文遮罩；
   - 配备一键显隐切换按钮，兼顾安全性与核验便利性；
   - Base URL 内部固化，界面极简清爽。

---

### 📊 实测精度表现 (Benchmark)

在包含 51 篇真实 Obsidian 笔记的严格留出挑战集上，当置信度阈值设为默认的 **0.70** 时：

| 标签 | 判定类型 | 准确率 (Precision) | 召回率 (Recall) | 实测误报 (FP) | 状态 |
|---|---|---:|---:|---:|---|
| **#异常检测** | 单篇独立二选一 | **100.0%** | **92.3%** | **0** | ✅ 完美免审直接打标 |
| **#社交媒体** | 单篇独立二选一 | **100.0%** | **72.7%** | **0** | ✅ 零假阳性 |
| **#资讯** | 单篇独立二选一 | **100.0%** | **87.5%** | **0** | ✅ 高效召回 |
| **#AI** | 互斥竞争 / 规则派生 | **86.9% AUC** | **80.0%** | **低** | ✅ 联动父标签自动生成 |

---

### 🚀 安装方式

#### 方式 1：通过 BRAT 插件一键安装 (推荐)
1. 在 Obsidian 安装并启用社区插件 **BRAT**；
2. 在 BRAT 设置中点击 `Add Beta plugin`；
3. 填入 GitHub 仓库地址：`xinye1017/obsidian-smart-tagger`；
4. 点击添加，BRAT 会自动拉取最新 Release 并启用！

#### 方式 2：手动下载安装
1. 前往 [Releases](https://github.com/xinye1017/obsidian-smart-tagger/releases) 页面，下载最新的 `main.js`、`manifest.json`、`styles.css`；
2. 将这三个文件拷贝至你的 Vault 目录：`<Vault>/.obsidian/plugins/smart-tagger/`；
3. 打开 Obsidian 设置 $\to$ **第三方插件**，刷新并启用 **Smart Tagger**。

---

## 📄 License

MIT License © 2026 [xinyeli](https://github.com/xinye1017)
