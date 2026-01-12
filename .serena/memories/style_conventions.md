# dbpilot コードスタイル・規約

## TypeScript / React

### Prettier 設定
- セミコロン: あり
- クォート: ダブルクォート (`"`)
- タブ幅: 2スペース
- 末尾カンマ: ES5形式
- 行幅: 80文字

### ESLint ルール
- `@typescript-eslint/recommended` ベース
- `react-hooks/recommended` ルール適用
- 未使用変数: エラー（`_` prefix で無視可能）

### TypeScript 設定
- target: ES2020
- strict モード有効
- 未使用ローカル変数・パラメータ: エラー

### 命名規則
- コンポーネント: PascalCase (`ResultGrid.tsx`)
- フック: camelCase with `use` prefix (`useConnectionStore.ts`)
- 型定義: PascalCase (`ConnectionConfig`)
- ファイル名: コンポーネントは PascalCase、それ以外は camelCase

## Rust

### フォーマット
- `rustfmt` を使用
- lint-staged で自動フォーマット

### 規約
- エラーハンドリング: `thiserror` でカスタムエラー定義、`anyhow` で伝播
- 非同期: `tokio` ランタイム使用
- シリアライズ: `serde` + `serde_json`
- 型生成: `ts-rs` で TypeScript 型を自動生成

## Git

### コミット前フック (Husky + lint-staged)
- `src/**/*.{ts,tsx}`: ESLint + Prettier
- `src/**/*.css`: Prettier
- `src-tauri/src/**/*.rs`: rustfmt

### ブランチ
- main: メインブランチ
