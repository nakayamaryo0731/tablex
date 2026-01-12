# dbpilot コードベース構造

```
dbpilot/
├── src/                      # React フロントエンド
│   ├── components/           # UIコンポーネント
│   ├── hooks/                # カスタムフック
│   ├── store/                # Zustand ストア
│   ├── types/                # TypeScript 型定義
│   ├── lib/                  # ユーティリティ
│   ├── test/                 # テストファイル
│   ├── assets/               # 静的アセット
│   ├── App.tsx               # ルートコンポーネント
│   ├── main.tsx              # エントリポイント
│   └── App.css               # グローバルスタイル
│
├── src-tauri/                # Rust バックエンド (Tauri)
│   ├── src/
│   │   ├── main.rs           # Tauri エントリポイント
│   │   ├── lib.rs            # ライブラリルート
│   │   ├── state.rs          # アプリケーション状態
│   │   ├── error.rs          # エラー定義
│   │   ├── commands/         # Tauri コマンド
│   │   ├── db/               # DB接続・クエリ
│   │   ├── ai/               # LLM連携
│   │   └── types/            # 型定義 (ts-rs)
│   ├── Cargo.toml            # Rust 依存関係
│   └── tauri.conf.json       # Tauri 設定
│
├── public/                   # 静的ファイル
├── docs/                     # ドキュメント
├── .github/                  # GitHub Actions
├── .husky/                   # Git フック
│
├── package.json              # npm スクリプト・依存関係
├── pnpm-lock.yaml            # pnpm ロックファイル
├── vite.config.ts            # Vite 設定
├── vitest.config.ts          # Vitest 設定
├── tsconfig.json             # TypeScript 設定
├── eslint.config.js          # ESLint 設定
├── .prettierrc               # Prettier 設定
├── index.html                # HTMLエントリ
├── DEVELOPMENT.md            # 開発ドキュメント
└── README.md                 # プロジェクト説明
```

## 主要ディレクトリの役割

### フロントエンド (`src/`)
- **components/**: 再利用可能なUIコンポーネント
- **hooks/**: React カスタムフック
- **store/**: Zustand による状態管理
- **types/**: TypeScript 型定義（ts-rs 生成含む）
- **lib/**: ユーティリティ関数
- **test/**: Vitest テストファイル

### バックエンド (`src-tauri/src/`)
- **commands/**: Tauriコマンド（フロントからの呼び出しエンドポイント）
- **db/**: PostgreSQL接続、クエリ実行
- **ai/**: Claude API / Ollama 連携
- **types/**: ts-rs による TypeScript 型生成元
- **error.rs**: thiserror によるエラー型定義
- **state.rs**: アプリケーション状態管理
