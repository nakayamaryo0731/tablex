# タスク完了時のチェックリスト

## コード変更後

### 1. フォーマット・リント
```bash
# TypeScript/React
pnpm lint:fix
pnpm format

# Rust
cd src-tauri && cargo fmt && cargo clippy
```

### 2. テスト実行
```bash
# 全テスト
pnpm test:all

# または個別に
pnpm test          # フロントエンド
pnpm test:rust     # Rust
```

### 3. 型チェック
```bash
# TypeScript 型チェック
pnpm build
```

### 4. Rust → TypeScript 型同期（型定義変更時）
```bash
pnpm generate:types
```

## コミット前

lint-staged が自動で以下を実行:
- TypeScript/React: ESLint --fix + Prettier
- CSS: Prettier
- Rust: rustfmt

## 注意事項

- `src-tauri/` 以下の Rust コードを変更した場合は `pnpm test:rust` を実行
- 型定義 (`ts-rs` derive) を変更した場合は `pnpm generate:types` で再生成
- 大きな変更の場合は `pnpm tauri dev` で動作確認
