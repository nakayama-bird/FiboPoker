# Research: フィボナッチポーカー技術調査

**Feature**: 001-fibo-poker  
**Date**: 2025-12-31  
**Status**: Completed

## Phase 0: Outline & Research

この文書は技術スタックの選択理由、ベストプラクティス、統合パターンを記録します。

---

## 1. Supabase Realtime 完了検知パターン

### Decision: PostgreSQL Triggers + Realtime Channels

**調査内容**:
- Supabase Realtimeは`onSnapshot`相当の機能を提供（PostgreSQL変更をWebSocket経由で配信）
- テーブル変更をリアルタイムで監視し、全参加者の選択完了を検知可能

**実装パターン**:
```sql
-- card_selections テーブルに対するRealtime購読
CREATE TABLE card_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  participant_id uuid NOT NULL REFERENCES participants(id),
  card_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE card_selections;
```

**クライアント実装**:
```typescript
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'card_selections' },
    (payload) => {
      // 全参加者の選択数をカウント
      if (allParticipantsSelected) {
        // 統計算出トリガー
      }
    }
  )
  .subscribe();
```

**Rationale**: 
- ポーリング不要（憲法 Principle IV: Event-Driven）
- Supabaseの標準機能のみで実装可能（Principle I: Simplicity First）
- 1秒以内の配信達成可能（Principle VI: Performance）

**Alternatives Considered**:
- ❌ クライアント側ポーリング（300ms間隔）: 無駄なリクエスト発生
- ❌ WebSocket独自実装: オーバーエンジニアリング（Simplicity違反）

---

## 2. 統計情報算出（最大/最小/中央値/平均）

### Decision: PostgreSQL関数で算出、Realtime経由で配信

**調査内容**:
- PostgreSQLはネイティブで`max()`, `min()`, `avg()`をサポート
- 中央値は`percentile_cont(0.5)`で算出可能
- トリガー関数で自動算出し、`round_results`テーブルに保存

**実装パターン**:
```sql
CREATE OR REPLACE FUNCTION calculate_round_statistics(p_room_id uuid)
RETURNS TABLE(max_value int, min_value int, median_value numeric, avg_value numeric)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    max(card_value)::int,
    min(card_value)::int,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY card_value),
    avg(card_value)
  FROM card_selections
  WHERE room_id = p_room_id;
END;
$$ LANGUAGE plpgsql;
```

**Rationale**:
- サーバーサイド計算で正確性保証（SC-005）
- クライアント側のロジック最小化（Simplicity First）
- PostgreSQLの最適化された集計関数を活用

**Alternatives Considered**:
- ❌ クライアント側JavaScript計算: 精度問題、複数クライアント間の不整合リスク
- ✅ PostgreSQL関数: データベースで一元管理、型安全

---

## 3. React Router 単一ページ管理パターン

### Decision: `/room/:id` URLパラメータでルーム識別

**調査内容**:
- React Router v6の`useParams()`でURLからルームID取得
- ブラウザ履歴管理なしで状態遷移（loading → selecting → results）
- URLのみでルーム共有可能（招待機能の基盤）

**実装パターン**:
```typescript
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/room/:id" element={<RoomPage />} />
  </Routes>
</BrowserRouter>

// RoomPage.tsx
const { id: roomId } = useParams();
const { room, participants, status } = useRoom(roomId);

// 状態に応じたコンポーネント表示
{status === 'selecting' && <CardSelector />}
{status === 'results' && <ResultsView />}
```

**Rationale**:
- URLがState of Truth（憲法 Principle VII）
- ページ遷移なしで状態管理（Single-Page原則）
- ブラウザの戻る/進む不要（ルーム内で完結）

**Alternatives Considered**:
- ❌ 複数ページ（/room/:id, /room/:id/results）: 状態不整合リスク、憲法違反
- ❌ クライアント側のみの状態管理: URL共有不可、リロード時に状態喪失

---

## 4. CSS Modules スタイリング戦略

### Decision: コンポーネント単位のCSS Modules

**調査内容**:
- Viteは標準でCSS Modulesをサポート
- スコープ分離でグローバル汚染を防止
- TypeScript型定義も自動生成可能

**実装パターン**:
```typescript
// CardSelector.module.css
.card {
  width: 80px;
  height: 120px;
  cursor: pointer;
  transition: transform 0.2s;
}

.card:hover {
  transform: scale(1.05);
}

.selected {
  border: 3px solid blue;
}

// CardSelector.tsx
import styles from './CardSelector.module.css';

<div className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
```

**Rationale**:
- 追加ライブラリ不要（Vite標準機能）
- 命名衝突なし（自動スコープ化）
- パフォーマンス良好（ビルド時処理）

**Alternatives Considered**:
- ❌ Tailwind CSS: 追加依存関係、憲法 Principle I違反
- ❌ styled-components: ランタイムオーバーヘッド、依存関係増加
- ✅ CSS Modules: 最小構成、Viteネイティブ

---

## 5. Supabase Anonymous Auth（セッション管理）

### Decision: Anonymous認証で最小限のユーザー識別

**調査内容**:
- Supabase Anonymous Authは個人情報不要でセッションを発行
- UUIDベースの一時的なユーザーID
- 名前入力のみでルーム参加可能

**実装パターン**:
```typescript
// services/supabase.ts
const { data, error } = await supabase.auth.signInAnonymously();

// ユーザー名とセッションIDを関連付け
await supabase
  .from('participants')
  .insert({
    session_id: data.session.user.id,
    display_name: userName,
    room_id: roomId
  });
```

**Rationale**:
- 個人情報収集不要（憲法 Principle V: Privacy First）
- セッション管理のみ（メールアドレス不要）
- Supabase標準機能で実装完結

**Alternatives Considered**:
- ❌ メール認証: オーバーキル、プライバシー侵害
- ❌ 認証なし: セキュリティリスク（不正データ投入）
- ✅ Anonymous Auth: バランスが最適

---

## 6. 自動データ削除（30分非アクティブ）

### Decision: PostgreSQL関数 + pg_cron で定期実行

**調査内容**:
- Supabaseは`pg_cron`拡張をサポート（定期ジョブ実行）
- 最終更新から30分経過したルームを自動削除
- カスケード削除で関連データも一括削除

**実装パターン**:
```sql
-- 自動削除関数
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE updated_at < now() - interval '30 minutes'
    AND (SELECT COUNT(*) FROM participants WHERE room_id = rooms.id) = 0;
END;
$$ LANGUAGE plpgsql;

-- 5分ごとに実行
SELECT cron.schedule(
  'cleanup-inactive-rooms',
  '*/5 * * * *',
  'SELECT cleanup_inactive_rooms();'
);
```

**Rationale**:
- サーバーサイドで確実に実行（クライアント依存なし）
- データ保持期間の明確化（憲法 Principle V: Privacy）
- Supabase標準機能のみ（追加インフラ不要）

**Alternatives Considered**:
- ❌ クライアント側タイマー: 信頼性低い、ブラウザ閉じたら動作しない
- ❌ Cloudflare Workers Cron: 追加サービス、複雑化
- ✅ pg_cron: データベース内で完結、最もシンプル

---

## 7. Cloudflare Pages デプロイ設定

### Decision: GitHub連携で自動ビルド・デプロイ

**調査内容**:
- Cloudflare PagesはViteプロジェクトを標準サポート
- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `dist`
- 環境変数でSupabase接続情報を設定

**設定内容**:
```yaml
# Cloudflare Pages 設定
Build command: npm run build
Build output directory: dist
Environment variables:
  VITE_SUPABASE_URL: https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Rationale**:
- Git pushで自動デプロイ（CI/CD不要）
- 無制限の帯域幅（憲法 Principle VI: Scalability）
- 全世界330+拠点のCDN（低レイテンシ）

**Alternatives Considered**:
- ❌ Netlify: 帯域幅制限あり（無料枠30GB）
- ✅ Cloudflare Pages: 完全無制限、より高速

---

## まとめ

すべての技術選択は憲法の7原則に準拠:

| 原則 | 技術選択 | 準拠理由 |
|------|---------|---------|
| I. Simplicity First | Vite + React + 最小依存 | 4ライブラリのみ |
| II. User-First | React Router + CSS Modules | 直感的UI、高速レスポンス |
| III. Independent Testing | Vitest + RTL | ストーリー単位でテスト可能 |
| IV. Event-Driven | Supabase Realtime | ポーリング不要、自動完了検知 |
| V. Privacy First | Anonymous Auth + pg_cron | 最小限認証、自動削除 |
| VI. Performance | Cloudflare Pages CDN | 無制限スケール、低レイテンシ |
| VII. Single-Page | React Router /room/:id | URL状態管理、ページ遷移なし |

**Phase 1（設計）への準備完了** ✅
