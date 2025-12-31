# Implementation Plan: フィボナッチポーカーアプリケーション

**Branch**: `001-fibo-poker` | **Date**: 2025-12-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-fibo-poker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

フィボナッチポーカーアプリケーション - 複数ユーザーがリアルタイムでストーリーポイントを見積もるツール。Vite + React + TypeScriptで構築し、Supabase Realtimeでリアルタイム同期、React Routerで単一ページ管理、Cloudflare Pagesにデプロイ。憲法のSimplicity First原則に従い、最小限の依存関係で実装。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode有効)  
**Primary Dependencies**: 
- react: ^18.3.0 (UIライブラリ)
- react-router-dom: ^6.21.0 (単一ページルーティング)
- @supabase/supabase-js: ^2.39.0 (リアルタイムDB接続)
- vite: ^5.0.0 (ビルドツール)

**Storage**: Supabase PostgreSQL (rooms, participants, card_selections, roundsテーブル)  
**Realtime**: Supabase Realtime (WebSocket経由でPostgreSQL変更をサブスクライブ)  
**Testing**: Vitest + React Testing Library (ユニット・統合テスト)  
**Target Platform**: モダンブラウザ (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Web SPA (Single Page Application)  
**Performance Goals**: 
- 初回ロード: < 2秒
- ユーザーアクション応答: < 300ms (憲法 SC-003)
- リアルタイム更新配信: < 1秒 (憲法 SC-002)

**Constraints**: 
- 最小限の依存関係 (憲法 Principle I)
- 単一ページ構成 (/room/:id) (憲法 Principle VII)
- イベント駆動アーキテクチャ (憲法 Principle IV)
- 自動データ削除: 30分非アクティブ後 (憲法 Principle V)

**Scale/Scope**: 
- 同時アクティブルーム: 50-100個
- 1ルームあたり最大参加者: 20人 (憲法 SC-004)
- 月間想定ユーザー: 500-1,000人 (Supabase無料枠内)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Simplicity First ✅ PASS
- **評価**: 最小限の依存関係（4つのみ: React, React Router, Supabase, Vite）
- **技術選択**: Vite（最速ビルド）+ React（標準的）は適切
- **YAGNI準拠**: 状態管理ライブラリ不要（React Context + Supabase Realtimeで十分）

### Principle II: User-First Experience ✅ PASS
- **直感的UI**: React Routerで/room/:id の単一ページ、URL共有で簡単参加
- **高速レスポンス**: Vite HMR、楽観的UI更新で300ms以下達成可能
- **アクセシビリティ**: CSS Modulesでセマンティックなマークアップが可能

### Principle III: Independent Testing ✅ PASS
- **ユーザーストーリー分割**: P1（単独動作）、P2（リアルタイム）、P3（招待）が独立
- **テスト独立性**: Vitest + React Testing LibraryでSupabaseモック可能

### Principle IV: Event-Driven State Management ✅ PASS
- **完了検知**: Supabase Realtimeの`onSnapshot`で全員の選択を監視
- **技術選択**: PostgreSQL Triggers + Realtime channelsでイベント駆動実装
- **統計算出**: PostgreSQL関数で最大/最小/中央値/平均を計算、Realtimeで配信

### Principle V: Privacy & Security First ✅ PASS
- **最小限認証**: Supabase Anonymous Auth（セッションのみ、個人情報不要）
- **データ削除**: PostgreSQL関数で30分非アクティブ後の自動削除実装
- **透明性**: データ保持ポリシーをUI上で明示

### Principle VI: Performance & Scalability ✅ PASS
- **レスポンスタイム**: Vite + Cloudflare Pages CDNで初回ロード2秒以内
- **イベント配信**: Supabase Realtime (< 200ms latency) で1秒以内達成可能
- **同時接続**: Supabase無料枠で50-100同時ルーム対応可能

### Principle VII: Single-Page State Management ✅ PASS
- **URLベースルーティング**: React Router の /room/:id でルーム識別
- **状態駆動UI**: Supabase Realtimeの変更をReact Stateで反映、自動UI切り替え
- **ページ遷移回避**: 単一ページ内で状態変更のみ（loading/selecting/results）

**総合評価**: ✅ 全原則に準拠。Phase 0（研究）に進行可能。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
FiboPoker/
├── src/
│   ├── components/           # Reactコンポーネント
│   │   ├── RoomPage.tsx     # /room/:id ページ
│   │   ├── CardSelector.tsx # カード選択UI
│   │   ├── ResultsView.tsx  # 結果表示
│   │   └── ParticipantList.tsx
│   ├── services/            # ビジネスロジック
│   │   ├── supabase.ts      # Supabase接続設定
│   │   ├── roomService.ts   # ルームCRUD操作
│   │   └── realtimeService.ts # Realtime購読管理
│   ├── hooks/               # カスタムReact Hooks
│   │   ├── useRoom.ts       # ルーム状態管理
│   │   └── useRealtime.ts   # Realtime購読
│   ├── types/               # TypeScript型定義
│   │   └── database.ts      # Supabaseテーブル型
│   ├── styles/              # CSS Modules
│   │   └── *.module.css
│   ├── App.tsx              # ルートコンポーネント
│   └── main.tsx             # エントリーポイント
├── tests/
│   ├── unit/                # コンポーネント単体テスト
│   └── integration/         # Supabase統合テスト
├── supabase/                # Supabase設定
│   ├── migrations/          # DBマイグレーション
│   │   └── 001_initial_schema.sql
│   └── functions/           # PostgreSQL関数
│       └── cleanup_inactive_rooms.sql
├── public/                  # 静的アセット
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Structure Decision**: Web SPA構成を採用。Viteの標準的なプロジェクト構造に従い、`src/`以下にコンポーネント、サービス、フック、型定義を配置。Supabase関連のSQL定義は`supabase/`ディレクトリで管理。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
