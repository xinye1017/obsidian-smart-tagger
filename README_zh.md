# Smart Tagger

<p align="center">
  <strong>一款基于云端模型 Jev 实现的 Obsidian 高速自动标签器。</strong>
</p>

<p align="center">
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/releases">GitHub Releases</a> ·
  <a href="README.md">English</a>
</p>

Smart Tagger 通过 Jev API 按照可配置的标签规则分析笔记。你可以查看当前笔记的标签推荐、自动应用高置信标签，也可以按指定范围批量处理 Markdown 文件。

## 功能

- **当前笔记推荐：** 可从侧边栏图标、命令面板或文件菜单打开推荐面板，查看标签置信度，逐个添加标签或一次应用所有达到阈值的标签。
- **自动应用：** 使用当前笔记的自动打标命令，将达到置信度阈值的标签写入笔记。
- **批量打标：** 默认扫描整个知识库，也可以选择某个文件夹；选择文件夹时会递归包含其下级文件夹中的 Markdown 文件。隐藏路径和模板路径会跳过。面板显示处理进度、已扫描笔记、更新笔记和新增标签数量，扫描过程中可以停止。
- **标签规则库：** 初始为空。扫描知识库中已经使用的标签即可生成规则，之后可按需启用或停用。
- **安全更新 Frontmatter：** 通过 Obsidian 的 Frontmatter API 添加标签，并保留已有的 Frontmatter 字段。
- **语言与阈值：** 界面支持简体中文和 English；可以设置自动应用标签的最低置信度。

## 工作逻辑

1. Smart Tagger 从笔记标题、标题层级和正文片段中整理出精简摘要。对于较短的笔记，还会附带所在文件夹路径作为上下文。
2. 插件将摘要和已启用的标签规则发送到 Jev 云端 API 进行评估。
3. 插件将返回结果与设置的置信度阈值比较。
4. 你可以查看推荐结果，或直接应用符合条件的标签。已有标签会保留，新标签会写入笔记的 Frontmatter。

笔记摘要和已启用的标签规则会发送给 Jev 进行评估。使用标签功能前，请在插件设置中填写 Jev API Key。

## 安装

1. 如果 Smart Tagger 已上架，可从 Obsidian 社区插件目录安装；也可以从 [GitHub Releases](https://github.com/xinye1017/obsidian-smart-tagger/releases) 下载插件文件。
2. 手动安装时，将 `main.js`、`manifest.json` 和 `styles.css` 放入 `<Vault>/.obsidian/plugins/smart-tagger/`。
3. 在 **设置 → 第三方插件** 中启用 Smart Tagger。
4. 在插件设置中填写 Jev API Key。

## 设置项

- **Jev API Key：** 用于认证 Jev API 请求；设置界面会遮罩显示密钥。
- **置信度阈值：** 自动应用标签所需的最低置信度。
- **标签规则库：** 从知识库中读取标签并生成规则，控制哪些标签参与评估。

## 从源码构建

克隆仓库并运行 `npm install` 安装依赖，然后执行 `npm run build`。

## 许可证

MIT License © 2026 [xinyeli](https://github.com/xinye1017)
