# API Contracts: フィボナッチポーカー

**Feature**: 001-fibo-poker  
**Technology**: Supabase Client SDK + Realtime  
**Date**: 2025-12-31

## Overview

このアプリケーションは**サーバーレスアーキテクチャ**を採用し、Supabase Client SDKを通じて直接PostgreSQLと通信します。REST APIは実装せず、Supabaseの標準機能（CRUD + Realtime）のみを使用します。

---

## 1. Room Management

### 1.1 ルーム作成

**Operation**: `INSERT INTO rooms`

```typescript
interface CreateRoomRequest {
  // 自動生成されるためリクエストパラメータなし
}

interface CreateRoomResponse {
  id: string;           // UUID
  code: string;         // 8文字の短縮コード
  status: 'active';
  created_at: string;   // ISO 8601
  updated_at: string;
}

// 実装例
const { data, error } = await supabase
  .from('rooms')
  .insert({})
  .select()
  .single();
```

**User Story**: P1 - ルーム作成とカード選択  
**Success Criteria**: SC-001 (30秒以内に完了)

---

### 1.2 ルーム取得

**Operation**: `SELECT FROM rooms WHERE code = ?`

```typescript
interface GetRoomRequest {
  code: string;  // URL パラメータから取得
}

interface GetRoomResponse {
  id: string;
  code: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  participants: Participant[];  // JOIN結果
  current_round: Round | null;
}

// 実装例
const { data, error } = await supabase
  .from('rooms')
  .select(`
    *,
    participants(*),
    rounds(*)
  `)
  .eq('code', roomCode)
  .order('rounds(round_number)', { ascending: false })
  .limit(1, { foreignTable: 'rounds' })
  .single();
```

**User Story**: P1, P2, P3  
**Success Criteria**: SC-003 (300ms以内応答)

---

## 2. Participant Management

### 2.1 参加者追加

**Operation**: `INSERT INTO participants`

```typescript
interface JoinRoomRequest {
  room_id: string;
  display_name: string;  // 最大50文字
}

interface JoinRoomResponse {
  id: string;
  room_id: string;
  session_id: string;  // Supabase auth.uid()
  display_name: string;
  is_active: true;
  created_at: string;
}

// 実装例
const { data: user } = await supabase.auth.signInAnonymously();

const { data, error } = await supabase
  .from('participants')
  .insert({
    room_id: roomId,
    session_id: user.user.id,
    display_name: displayName
  })
  .select()
  .single();
```

**User Story**: P3 - メンバー招待とルーム共有  
**Business Rule**: 同一ルーム内で`session_id`重複不可

---

### 2.2 参加者一覧取得

**Operation**: `SELECT FROM participants WHERE room_id = ?`

```typescript
interface GetParticipantsRequest {
  room_id: string;
}

interface GetParticipantsResponse {
  participants: Array<{
    id: string;
    display_name: string;
    is_active: boolean;
    has_selected: boolean;  // 現在のラウンドで選択済みか
  }>;
}

// 実装例（現在のラウンドの選択状態も含む）
const { data, error } = await supabase
  .from('participants')
  .select(`
    *,
    card_selections!inner(round_id)
  `)
  .eq('room_id', roomId)
  .eq('card_selections.round_id', currentRoundId);
```

**User Story**: P2, P3  
**Realtime**: ✅ `participants`テーブルの変更を監視

---

## 3. Round Management

### 3.1 新規ラウンド開始

**Operation**: `INSERT INTO rounds`

```typescript
interface StartRoundRequest {
  room_id: string;
}

interface StartRoundResponse {
  id: string;
  room_id: string;
  round_number: number;
  status: 'selecting';
  created_at: string;
}

// 実装例
const { data: prevRound } = await supabase
  .from('rounds')
  .select('round_number')
  .eq('room_id', roomId)
  .order('round_number', { ascending: false })
  .limit(1)
  .single();

const nextRoundNumber = (prevRound?.round_number ?? 0) + 1;

const { data, error } = await supabase
  .from('rounds')
  .insert({
    room_id: roomId,
    round_number: nextRoundNumber,
    status: 'selecting'
  })
  .select()
  .single();
```

**User Story**: P2 - 見積もり完了の自動検知と結果表示  
**Acceptance Scenario**: "新しいラウンドを開始すると、すべての選択がリセット"

---

### 3.2 ラウンド完了（結果表示）

**Operation**: `CALL calculate_round_statistics(round_id)`

```typescript
interface RevealRoundRequest {
  round_id: string;
}

interface RevealRoundResponse {
  id: string;
  status: 'revealed';
  max_value: number;
  min_value: number;
  median_value: number;
  avg_value: number;
  revealed_at: string;
  selections: Array<{
    participant_id: string;
    display_name: string;
    card_value: number;
  }>;
}

// 実装例（PostgreSQL関数を呼び出し）
const { error } = await supabase.rpc('calculate_round_statistics', {
  p_round_id: roundId
});

// 結果取得
const { data } = await supabase
  .from('rounds')
  .select(`
    *,
    card_selections(
      participant_id,
      card_value,
      participants(display_name)
    )
  `)
  .eq('id', roundId)
  .single();
```

**User Story**: P2 - 見積もり完了の自動検知と結果表示  
**Success Criteria**: SC-002 (1秒以内に配信)  
**Realtime**: ✅ `rounds`テーブルの`status='revealed'`を監視

---

## 4. Card Selection

### 4.1 カード選択

**Operation**: `INSERT INTO card_selections`

```typescript
interface SelectCardRequest {
  round_id: string;
  participant_id: string;
  card_value: 1 | 2 | 3 | 5 | 8 | 13 | 21;
}

interface SelectCardResponse {
  id: string;
  round_id: string;
  participant_id: string;
  card_value: number;
  created_at: string;
}

// 実装例（UPSERT: 既存選択を上書き）
const { data, error } = await supabase
  .from('card_selections')
  .upsert({
    round_id: roundId,
    participant_id: participantId,
    card_value: cardValue
  }, {
    onConflict: 'round_id,participant_id'
  })
  .select()
  .single();
```

**User Story**: P1 - ルーム作成とカード選択  
**Success Criteria**: SC-003 (300ms以内にUIフィードバック)  
**Realtime**: ✅ `card_selections`テーブルの変更を監視

---

### 4.2 完了検知トリガー

**Automated Trigger**: クライアント側で実装

```typescript
// Realtime監視による自動完了検知
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'card_selections',
    filter: `round_id=eq.${currentRoundId}`
  }, (payload) => {
    // 全参加者が選択したか確認
    checkAllParticipantsSelected();
  })
  .subscribe();

async function checkAllParticipantsSelected() {
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .eq('is_active', true);

  const { count: selectionCount } = await supabase
    .from('card_selections')
    .select('*', { count: 'exact', head: true })
    .eq('round_id', currentRoundId);

  if (participantCount === selectionCount) {
    // 統計算出関数を呼び出し
    await supabase.rpc('calculate_round_statistics', {
      p_round_id: currentRoundId
    });
  }
}
```

**User Story**: P2 - 見積もり完了の自動検知  
**Success Criteria**: SC-002 (1秒以内に結果配信)

---

## 5. Realtime Subscriptions

### 5.1 ルーム状態監視

```typescript
interface RealtimeRoomChannel {
  channel: string;  // `room:${roomId}`
  events: {
    participants: 'INSERT' | 'UPDATE';
    card_selections: 'INSERT';
    rounds: 'UPDATE';
  };
}

// 実装例
const roomChannel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'participants',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    // 参加者リスト更新
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'card_selections'
  }, (payload) => {
    // 選択状態更新 + 完了検知
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rounds',
    filter: `id=eq.${currentRoundId}`
  }, (payload) => {
    if (payload.new.status === 'revealed') {
      // 結果表示画面に遷移
    }
  })
  .subscribe();
```

**User Story**: P2 - リアルタイム更新  
**Success Criteria**: SC-002, SC-003  
**Performance**: Supabase Realtimeのレイテンシ < 200ms

---

## 6. Authentication

### 6.1 Anonymous Auth

```typescript
interface AuthenticateRequest {
  // リクエストパラメータなし
}

interface AuthenticateResponse {
  user: {
    id: string;  // UUID (session_id)
    aud: 'authenticated';
    role: 'anon';
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// 実装例
const { data, error } = await supabase.auth.signInAnonymously();
```

**User Story**: すべてのストーリーで必須  
**Privacy**: 個人情報不要（憲法 Principle V）

---

## Error Handling

### Standard Error Response

```typescript
interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;  // '23505' (unique violation), '23503' (foreign key), etc.
}

// 実装例
const { data, error } = await supabase.from('rooms').insert({});

if (error) {
  if (error.code === '23505') {
    // UNIQUE制約違反
  } else if (error.code === '23503') {
    // 外部キー制約違反
  }
}
```

---

## Rate Limiting

Supabase無料プランの制限:
- API requests: 無制限（ただし合理的な使用範囲内）
- Realtime connections: 200 concurrent/project
- Database storage: 500MB

**対応策**:
- クライアント側でリクエストの防止（デバウンス）
- 異常なリクエストはRLS（Row Level Security）でブロック

---

## Testing Contracts

### Unit Tests (Vitest)

```typescript
describe('Card Selection', () => {
  it('should insert card selection', async () => {
    const { data } = await supabase
      .from('card_selections')
      .insert({
        round_id: mockRoundId,
        participant_id: mockParticipantId,
        card_value: 5
      })
      .select()
      .single();

    expect(data.card_value).toBe(5);
  });
});
```

### Integration Tests

```typescript
describe('Complete Round Flow', () => {
  it('should reveal results when all participants select', async () => {
    // 3人の参加者がすべて選択
    await Promise.all([
      selectCard(participant1, 3),
      selectCard(participant2, 5),
      selectCard(participant3, 8)
    ]);

    // Realtime経由でrounds.status='revealed'を受信
    await waitForRealtimeUpdate();

    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    expect(round.status).toBe('revealed');
    expect(round.max_value).toBe(8);
    expect(round.min_value).toBe(3);
  });
});
```

---

## まとめ

**アーキテクチャの特徴**:
- ✅ REST API不要（Supabase Client SDKで直接DB操作）
- ✅ サーバーレス（PostgreSQL関数のみ）
- ✅ リアルタイム対応（Supabase Realtime）
- ✅ 型安全（TypeScript + Supabase型生成）

**憲法準拠**:
- Principle I: 最小限の依存関係（追加APIサーバー不要）
- Principle IV: イベント駆動（Realtime Channels）
- Principle V: プライバシー優先（Anonymous Auth）
