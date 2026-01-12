# dbpilot 開発コマンド

## 開発

```bash
# 開発サーバー起動（Tauri + Vite）
pnpm tauri dev

# フロントエンドのみ開発
pnpm dev
```

## ビルド

```bash
# プロダクションビルド
pnpm tauri build

# フロントエンドのみビルド
pnpm build
```

## テスト

```bash
# フロントエンドテスト実行（単発）
pnpm test

# フロントエンドテスト（ウォッチモード）
pnpm test:watch

# カバレッジ付きテスト
pnpm test:coverage

# Rustテスト実行
pnpm test:rust

# 全テスト実行（フロント + Rust）
pnpm test:all
```

## リント・フォーマット

```bash
# ESLint実行
pnpm lint

# ESLint + 自動修正
pnpm lint:fix

# Prettier フォーマット
pnpm format

# Prettier フォーマットチェック
pnpm format:check

# Rust フォーマット
cd src-tauri && cargo fmt

# Rust リント
cd src-tauri && cargo clippy
```

## 型生成

```bash
# Rust → TypeScript 型定義生成
pnpm generate:types
```

## システムコマンド (macOS)

```bash
# ファイル検索
find . -name "*.rs"

# テキスト検索
grep -r "pattern" src/

# Git操作
git status
git add .
git commit -m "message"
git push
```
