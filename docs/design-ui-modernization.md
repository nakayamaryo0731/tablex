# UI モダン化計画: TablePlus風 + shadcn/ui

## 概要
現在の基本的なTailwind UIを、shadcn/uiを導入してTablePlus風のクリーンでモダンなデザインに刷新する。

## デザイン方針
- **TablePlus風**: シンプル、クリーン、macOSネイティブ感
- **shadcn/ui**: モダンなコンポーネントライブラリ
- **特徴**:
  - 控えめなシャドウとラウンドコーナー
  - データ表示にモノスペースフォント
  - ソフトなカラーパレット
  - コンパクトだが読みやすいレイアウト

## Phase 1: 基盤セットアップ

### 1.1 依存関係インストール
```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm add @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-scroll-area @radix-ui/react-separator
```

### 1.2 ユーティリティ作成
**新規: `src/lib/utils.ts`**
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 1.3 デザイントークン (CSS変数)
**修正: `src/App.css`** - カラーパレット、シャドウ、角丸などのCSS変数を追加

## Phase 2: shadcn/ui コンポーネント導入

### インストールするコンポーネント
1. `button` - ボタンバリアント (default, outline, ghost, destructive)
2. `input` - フォーム入力
3. `dialog` - モーダルダイアログ
4. `select` - ドロップダウン
5. `tabs` - タブナビゲーション
6. `tooltip` - アイコンツールチップ
7. `scroll-area` - スクロールコンテナ
8. `separator` - 区切り線

**新規ディレクトリ: `src/components/ui/`**

## Phase 3: コンポーネント刷新

### 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/App.css` | CSS変数追加、フォント設定 |
| `src/lib/utils.ts` | 新規作成 - cn()ヘルパー |
| `src/components/ui/*` | 新規 - shadcn/uiコンポーネント |
| `src/components/layout/Header.tsx` | shadcn Button, コンパクト化 |
| `src/components/layout/Sidebar.tsx` | ScrollArea追加 |
| `src/components/layout/MainPanel.tsx` | shadcn Tabs |
| `src/components/layout/StatusBar.tsx` | ステータスインジケータ改善 |
| `src/components/schema/SchemaTree.tsx` | Lucideアイコン、新スタイル |
| `src/components/result/ResultGrid.tsx` | モノスペースフォント、ツールバー改善 |
| `src/components/connection/ConnectionDialog.tsx` | shadcn Dialog |
| `src/components/ai/AiQueryBar.tsx` | スタイル改善 |
| `src/components/ai/AiSettingsDialog.tsx` | shadcn Dialog, Select |

### 主な視覚的変更

1. **Header** (h-12 → h-11)
   - 控えめなシャドウ追加
   - Connectボタンをアウトラインスタイルに
   - 接続名をバッジ表示

2. **Sidebar**
   - Lucideアイコンに統一
   - ホバー/選択状態の改善
   - スクロールエリアの追加

3. **MainPanel**
   - タブを下線スタイルに統一
   - ボタン階層の改善 (Primary/Secondary/Ghost)

4. **ResultGrid** (最大の変更)
   - モノスペースフォントでデータ表示
   - NULL値のスタイル改善
   - スティッキーヘッダー + シャドウ
   - ツールバーのコンパクト化

5. **Dialogs**
   - shadcn/ui Dialogで統一
   - セクション分けの改善
   - フォーカス状態のリング追加

6. **StatusBar** (h-6のまま)
   - 接続状態ドットにグロー効果

## カラーパレット

```css
:root {
  --primary: 221 83% 53%;        /* 青 - 主要アクション */
  --success: 142 76% 36%;        /* 緑 - 接続/保存 */
  --destructive: 0 84% 60%;      /* 赤 - 削除/切断 */
  --muted: 220 14% 96%;          /* グレー - 背景 */
  --border: 220 13% 91%;         /* ボーダー */
  --radius: 0.5rem;              /* 角丸 */
}
```

## 実装順序

1. **基盤** - utils.ts, CSS変数, 依存関係
2. **UIコンポーネント** - shadcn/uiコンポーネント追加
3. **Header & StatusBar** - 最もシンプルな部分から
4. **Sidebar & SchemaTree** - アイコンとツリー
5. **MainPanel & Dialogs** - タブとモーダル
6. **ResultGrid** - 最も複雑、最後に

## 検証方法

1. `pnpm build` - TypeScriptエラーなし
2. `pnpm tauri dev` でアプリ起動
3. 各コンポーネントの表示確認:
   - ライトモード/ダークモードの切り替え
   - 接続ダイアログの開閉
   - スキーマツリーの展開/折りたたみ
   - クエリ実行と結果表示
   - CRUD操作のボタン表示
