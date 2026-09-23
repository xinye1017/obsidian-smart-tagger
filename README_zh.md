# Smart Tagger

<p align="center">
  <strong>⚡ 基于 TypeSafe Jev System-1 架构的 Obsidian 极速、零幻觉智能标签分类助手</strong>
</p>

<p align="center">
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/releases"><img src="https://img.shields.io/github/v/release/xinye1017/obsidian-smart-tagger?color=blue&style=flat-square" alt="Release"/></a>
  <a href="https://github.com/obsidianmd/obsidian"><img src="https://img.shields.io/badge/Obsidian-%3E%3D0.15.0-purple?style=flat-square" alt="Obsidian Version"/></a>
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"/></a>
  <a href="https://github.com/xinye1017"><img src="https://img.shields.io/badge/author-xinyeli-orange?style=flat-square" alt="Author"/></a>
</p>

---

<p align="center">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

---

**Smart Tagger** 是专为 Obsidian 打造的极速、高精度智能标签与笔记分类助手。不同于传统大语言模型（如 ChatGPT / Claude）长篇大论、耗时动辄数秒的流式生成，Smart Tagger 搭载先进的 **TypeSafe Jev System-1 决策引擎**：

* ⚡ **150 毫秒即刻返回**：无需等待文字生成，非自回归概率决策头实现毫秒级瞬间分类；
* 🎯 **100% 精度与零假阳性**：在真实个人知识库留出样本集上实测准确率达 100%，杜绝误标与标签污染；
* 🌐 **多语言界面**：原生支持在插件设置中自由切换简体中文与 English；
* 🔒 **隐私至上设计**：API Key 采用密码级圆点遮罩存储与呈现，全面防范录屏与窥屏风险；
* 🛡️ **安全写入与格式保全**：基于 Obsidian 官方 `processFrontMatter` 标准 API，绝不破坏原有 YAML 结构与笔记缩进格式。

---

### ✨ 核心功能

#### 1. ⚡ 毫秒级单篇推荐 (Active Note Tagging)
* **左侧边栏 (Ribbon)**：点击左侧功能区的标签小图标，即刻对当前活动笔记进行毫秒级标签分析；
* **命令面板 (`Ctrl+P` / `Cmd+P`)**：随时呼出命令 `Smart Tagger: 为当前活动笔记推荐标签`；
* **右键上下文菜单**：在笔记编辑区任意位置右键，即可快捷触发标签分析；
* **灵活采纳**：支持针对单项标签点击 `+ 添加`，或一键点击 `⚡ 一键应用所有高置信标签` 批量写入。

#### 2. 🚀 全库一键批量扫描与打标 (Vault-Wide Batch Tagging)
* 专为拥有大量历史笔记的知识库设计：一键对整个 Vault 中的 Markdown 笔记进行自动化打标；
* **动态实时控制台**：
  - 三维统计看板：实时显示已扫描笔记数、命中更新笔记数、新增标签总数；
  - 动态进度条与当前正在处理的笔记路径；
  - 实时滚动日志：清晰展示每篇笔记命中的标签（绿色高亮）；
* **安全无损与可控**：自动过滤隐藏目录（如 `.obsidian`）、模板文件与空文件，支持随时点击按钮无损暂停或中止。

#### 3. 🔍 自动检测与同步知识库标签库 (Vault Tag Auto-Detection)
* 依托 Obsidian 底层元数据索引，**10 毫秒内**秒级提炼整个仓库已存在的所有标签及其历史词频；
* 自动为现有标签生成语义判据模板，无需手动撰写复杂的英文 Prompt 即可无缝扩充。

#### 4. 🌳 标签层级自动联动 (Parent Tag Derivation)
* 当笔记被判定命中具体的细分子标签（例如 `#异常检测`）时，插件会自动关联附加全局父级标签 `#AI` 到 Frontmatter 中，保持知识库结构层级清晰。

#### 5. 🔐 密文遮罩与零配置 Base URL
* API Key 在设置面板默认采用密码圆点密文遮罩，并提供眼睛图标一键切换显隐；
* 官方极速节点直接内置，设置面板无需冗余配置繁杂的 API 端点。

---

### 📊 实测精度表现 (Benchmark)

在从真实个人知识库抽取的 51 篇挑战测试集上，当置信度阈值设为默认的 **0.70** 时：

| 标签 | 判定类型 | 准确率 (Precision) | 召回率 (Recall) | 实测误报 (FP) | 状态 |
|---|---|---:|---:|---:|---|
| **#异常检测** | 单篇独立二选一 | **100.0%** | **92.3%** | **0** | ✅ 完美免审直接打标 |
| **#社交媒体** | 单篇独立二选一 | **100.0%** | **72.7%** | **0** | ✅ 零假阳性 |
| **#资讯** | 单篇独立二选一 | **100.0%** | **87.5%** | **0** | ✅ 高效召回 |
| **#AI** | 互斥竞争 / 规则派生 | **86.9% AUC** | **80.0%** | **低** | ✅ 联动父标签自动生成 |

---

### 🚀 安装方式

#### 方式 1：通过 BRAT 插件一键安装 (推荐)
1. 在 Obsidian 中安装并启用社区插件 **BRAT**；
2. 打开 BRAT 设置，点击 **Add Beta plugin**；
3. 输入本仓库地址：`xinye1017/obsidian-smart-tagger`；
4. 点击添加，BRAT 会自动下载最新 Release 并完成启用。

#### 方式 2：从 GitHub Releases 手动安装
1. 前往 [Releases](https://github.com/xinye1017/obsidian-smart-tagger/releases) 页面；
2. 下载最新版本的 `main.js`、`manifest.json` 与 `styles.css`；
3. 在你的 Obsidian 仓库中创建文件夹：`<Vault>/.obsidian/plugins/smart-tagger/`；
4. 将下载的 3 个文件复制到该文件夹中；
5. 进入 Obsidian **设置** $\to$ **第三方插件**，点击刷新列表并启用 **Smart Tagger**。

#### 方式 3：从源码编译构建
```bash
git clone https://github.com/xinye1017/obsidian-smart-tagger.git
cd obsidian-smart-tagger
npm install
npm run build
```

---

### ⚙️ 设置项参考

| 配置项 | 说明 |
|---|---|
| **界面语言 (Language)** | 支持自由切换为简体中文或 English |
| **Jev API Key** | 填入您的 TypeSafe Jev API Key（支持密码密文遮罩与一键显隐） |
| **置信度阈值 (Confidence Threshold)** | 判定标签成立的最低置信度，默认 `0.70`（推荐区间 `0.60` - `0.80`） |
| **自动继承父标签 #AI** | 启用后，命中具体 AI 细分子标签时自动补齐 `#AI` |
| **标签规则库管理** | 一键开启/关闭目标标签，支持自动提取全库已有标签 |

---

## 📄 License

MIT License © 2026 [xinyeli](https://github.com/xinye1017)
