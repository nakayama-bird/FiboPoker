# FiboPoker

リアルタイム協調型フィボナッチポーカーアプリケーション

## 🚀 デモ

**https://fibopoker.pages.dev/**

## 概要

FiboPokerは、アジャイル開発のプランニングポーカーをオンラインで実施できるWebアプリケーションです。
複数のメンバーが同時にカードを選択し、リアルタイムで結果を共有できます。

### 主な機能

- 🎴 **フィボナッチカード選択**: 1, 2, 3, 5, 8, 13, 21のカードから選択
- 👥 **リアルタイム同期**: 参加者の選択状態をリアルタイムで表示
- 📊 **統計表示**: 最大値、最小値、中央値、平均値を自動計算
- 🔄 **自動集計**: 全員が選択完了で自動的に結果を表示
- 🔗 **簡単参加**: URLを共有するだけで参加可能
- 📱 **レスポンシブ対応**: PC・タブレット・スマートフォンで利用可能
- 🔌 **再接続対応**: ネットワーク切断時の自動再接続機能

## 技術スタック

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Styling**: CSS Modules
- **Deployment**: Cloudflare Pages

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント

### 1. リポジトリのクローン

```bash
git clone https://github.com/nakayama-bird/FiboPoker.git
cd FiboPoker
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseのセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editorで `supabase/migrations/001_initial_schema.sql` を実行
3. Settings > API から以下の情報を取得：
   - Project URL
   - anon/public API key

### 4. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集してSupabaseの情報を設定：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

### 6. ビルド

```bash
npm run build
```

## 使い方

### ルームの作成

1. トップページで「新しいルームを作成」をクリック
2. 表示名を入力して参加
3. 招待URLを他の参加者に共有

### カードの選択

1. 待機室で「ラウンドを開始」をクリック（オーナーのみ）
2. フィボナッチカードから1枚選択
3. 全員が選択完了すると自動的に結果が表示される

### 新しいラウンド

結果画面で「新しいラウンドを開始」をクリック（オーナーのみ）

## プロジェクト構成

```
FiboPoker/
├── src/
│   ├── components/       # Reactコンポーネント
│   ├── hooks/            # カスタムフック
│   ├── services/         # Supabase API呼び出し
│   ├── types/            # TypeScript型定義
│   └── styles/           # グローバルスタイル
├── supabase/
│   └── migrations/       # データベースマイグレーション
├── specs/                # 仕様書・タスク管理
└── docs/                 # ドキュメント
```

## 開発

### コマンド

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm run lint` - ESLintによるコードチェック

### ブランチ戦略

- `master` - 本番環境
- `feature/*` - 機能開発

## ライセンス

MIT
