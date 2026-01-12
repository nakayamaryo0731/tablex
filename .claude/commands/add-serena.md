# Serena MCP サーバーの追加方法

## 方法1: Claude Code の設定ファイルを直接編集

`~/.claude.json` の該当プロジェクトの `mcpServers` に以下を追加:

```json
"serena": {
  "type": "stdio",
  "command": "uvx",
  "args": [
    "--from",
    "git+https://github.com/oraios/serena",
    "serena",
    "start-mcp-server",
    "--context",
    "claude-code",
    "--project",
    "$PROJECT_PATH"
  ],
  "env": {}
}
```

`$PROJECT_PATH` を実際のプロジェクトパスに置き換えてください。

## 方法2: Claude Code の `/mcp` コマンドを使用

1. Claude Code で `/mcp` と入力
2. 「Add new MCP server」を選択
3. 以下の情報を入力:
   - Name: `serena`
   - Type: `stdio`
   - Command: `uvx`
   - Args: `--from git+https://github.com/oraios/serena serena start-mcp-server --context claude-code --project /path/to/project`

## 前提条件

- `uv` (Python パッケージマネージャー) がインストールされていること
- インストール: `curl -LsSf https://astral.sh/uv/install.sh | sh`

## context オプション

- `claude-code`: Claude Code 用に最適化
- `ide-assistant`: IDE アシスタント用

## 確認方法

Claude Code を再起動後、`/mcp` コマンドで Serena が表示されれば成功です。

---

# Serena オンボーディング手順

## オンボーディングとは

Serena がプロジェクトを効率的に理解・操作するための初期設定です。プロジェクトの概要、技術スタック、コマンド、コード規約などをメモリファイルに保存します。

## オンボーディングの実行方法

1. **Serena を追加した状態で Claude Code を起動**

2. **オンボーディング状態を確認**
   ```
   「Serenaのオンボーディングを確認して」
   ```
   → `check_onboarding_performed` ツールが呼ばれ、未実施なら次へ

3. **オンボーディングを実行**
   ```
   「Serenaのオンボーディングをして」
   ```
   → Claude が以下を自動で行います：
   - プロジェクト構造の調査
   - package.json / Cargo.toml の読み取り
   - 設定ファイル（ESLint, Prettier, tsconfig等）の確認
   - メモリファイルへの情報保存

## 生成されるメモリファイル

| ファイル名 | 内容 |
|------------|------|
| `project_overview.md` | プロジェクト概要、技術スタック |
| `suggested_commands.md` | 開発・テスト・ビルドコマンド |
| `style_conventions.md` | コードスタイル、命名規則 |
| `task_completion.md` | タスク完了時のチェックリスト |
| `codebase_structure.md` | ディレクトリ構造の説明 |

## メモリの確認・編集

```
「Serenaのメモリを一覧表示して」  # list_memories
「○○のメモリを読んで」           # read_memory
「○○のメモリを更新して」         # edit_memory / write_memory
```

## 注意事項

- オンボーディングは会話ごとに1回のみ実行
- メモリファイルは `.serena/memories/` に保存される
- プロジェクト構成が大きく変わった場合は再オンボーディングを推奨
