# dbpilot プロジェクト概要

## 概要
**dbpilot** - Rust + Tauriで作るDBクライアントアプリケーション

- GitHub: https://github.com/nakayamaryo0731/dbpilot
- 対応DB: PostgreSQL（初期ターゲット）

## 主な機能
1. **SQLエディタ** - Monaco Editorベース、シンタックスハイライト、補完
2. **スキーマ表示** - テーブル、カラム、型、制約情報
3. **ER図** - React Flowでリレーション可視化
4. **インデックス/外部キー情報** - 詳細なDB構造の閲覧
5. **AI機能** - 自然言語からSQL生成（Claude API / Ollama）
6. **エクスポート機能** - CSV / Google Sheets出力

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript + Vite 7 |
| 状態管理 | Zustand |
| SQLエディタ | Monaco Editor |
| ER図 | React Flow (@xyflow/react) |
| テーブル表示 | TanStack Table |
| UIコンポーネント | Radix UI + Tailwind CSS 4 |
| アイコン | Lucide React |
| バックエンド | Rust + Tauri |
| DB接続 | sqlx (非同期、PostgreSQL) |
| 型生成 | ts-rs (Rust → TypeScript) |
| エラーハンドリング | anyhow + thiserror |
| パスワード保存 | keyring |

## 環境要件
- rustc 1.92.0+
- cargo 1.92.0+
- node v24.9.0+
- pnpm 10.18.0+
