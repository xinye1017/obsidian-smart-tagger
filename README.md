# Smart Tagger

<p align="center">
  <strong>A fast Obsidian auto-tagger powered by the Jev cloud model.</strong>
</p>

<p align="center">
  <a href="https://github.com/xinye1017/obsidian-smart-tagger/releases">Releases</a> ·
  <a href="README_zh.md">简体中文</a>
</p>

Smart Tagger evaluates notes against a configurable tag library through the Jev API. It can recommend tags for the active note, apply high-confidence tags automatically, or process Markdown notes in a chosen scope.

## Features

- **Active-note tagging:** Open recommendations from the ribbon, command palette, or file context menu. Review confidence scores and add tags individually or apply all tags above the configured threshold.
- **Automatic application:** Run the active-note command to apply tags that meet the confidence threshold.
- **Batch tagging:** Choose the entire vault (the default) or a specific folder. Folder selection includes Markdown files in nested folders. Hidden paths and template paths are skipped. The panel shows progress, processed notes, updated notes, and tags added; a running scan can be stopped.
- **Tag library:** Starts empty. Sync tags already used in the vault to create rules, then enable or disable them as needed.
- **Frontmatter updates:** Tags are added through Obsidian's frontmatter API, while existing frontmatter fields are retained.
- **Language and threshold settings:** Use the interface in English or Simplified Chinese and set the minimum confidence required for automatic application.

## How tagging works

1. Smart Tagger prepares a compact note summary from the title, headings, and excerpts of the note. For short notes, it also includes the parent folder path as context.
2. The plugin sends that summary and enabled tag rules to the Jev cloud API for evaluation.
3. The results are compared with the configured confidence threshold.
4. You review recommendations or apply eligible tags. Existing tags are left in place, and new tags are written to the note's frontmatter.

The note summary and enabled tag criteria are sent to Jev for evaluation. Configure your Jev API key in the plugin settings before using tagging features.

## Installation

1. Install Smart Tagger from the Obsidian community plugin directory when available, or download the plugin files from [GitHub Releases](https://github.com/xinye1017/obsidian-smart-tagger/releases).
2. For manual installation, place `main.js`, `manifest.json`, and `styles.css` in `<Vault>/.obsidian/plugins/smart-tagger/`.
3. Enable Smart Tagger under **Settings → Community plugins**.
4. Enter your Jev API key in the plugin settings.

## Settings

- **Jev API key:** Used to authenticate requests to the Jev API. The settings field masks the key while it is displayed.
- **Confidence threshold:** Minimum score for automatic tag application.
- **Auto-add parent tag:** Optionally add the parent AI tag when certain configured AI sub-tags are applied.
- **Tag library:** Enable or disable the tag rules used during evaluation.

## Build from source

Clone the repository, install dependencies with `npm install`, then run `npm run build`.

## License

MIT License © 2026 [xinyeli](https://github.com/xinye1017)
