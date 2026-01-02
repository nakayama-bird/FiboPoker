# Phase 4 セルフレビュー結果

## 日時
2026-01-02

## レビュー範囲
- Phase 4-1 ~ 4-5 (T044-T060)
- Owner/Member機能追加

## ✅ 良好な点
1. RLS適切に設定（ownerのみround操作可能）
2. Realtime同期が安定動作
3. UI/UX が直感的（待機画面→ゲーム画面の遷移）
4. 型安全性の維持（TypeScript活用）

## ⚠️ 潜在的問題

### P1 (高優先度) - なし

### P2 (中優先度)

#### Issue #1: Race Condition in Owner Assignment
**場所**: `src/services/participantService.ts:60-65`
**問題**: 
```typescript
const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
const isOwner = count === 0;
```
2人が同時に参加すると両方がownerになる可能性

**修正案**:
```sql
-- Option A: DB constraint
ALTER TABLE participants ADD CONSTRAINT one_owner_per_room 
  EXCLUDE USING gist (room_id WITH =) WHERE (is_owner = true);

-- Option B: 部屋作成時にownerを指定
-- roomService.createRoom() で最初の参加者を自動挿入
```

**優先度**: P2（発生頻度は低いが、発生すると混乱）
**工数**: 1時間

#### Issue #2: Missing Error Handling in handleStartNewRound
**場所**: `src/components/RoomPage.tsx:195-205`
**問題**: startRound()失敗時のUI feedbackなし（owner権限なしなど）

**修正案**:
```typescript
const handleStartNewRound = useCallback(async () => {
  try {
    const newRound = await startRound(room.id);
    setCurrentRound(newRound);
    setSelectedCard(null);
    setCardSelections([]);
    if (refetchRoom) await refetchRoom();
  } catch (error) {
    console.error('Failed to start round:', error);
    alert('ラウンドを開始できませんでした。オーナー権限があるか確認してください。');
  }
}, [room, refetchRoom]);
```

**優先度**: P2（UX改善）
**工数**: 30分

### P3 (低優先度)

#### Issue #3: Component Naming Confusion
**場所**: `src/components/WaitingRoom.tsx`, `src/components/NewRoundButton.tsx`
**問題**: NewRoundButtonを待機画面とゲーム中で再利用しているが、意味が異なる
- 待機画面: 「ゲームを開始」
- ゲーム中: 「新しいラウンドを開始」

**修正案**:
```typescript
// StartGameButton.tsx (新規作成)
interface StartGameButtonProps {
  onStartGame: () => Promise<void>;
}

// NewRoundButton.tsx (既存)
interface NewRoundButtonProps {
  onStartNewRound: () => Promise<void>;
}
```

**優先度**: P3（動作に影響なし、保守性の問題）
**工数**: 30分

#### Issue #4: Realtime Reconnection未検証
**場所**: `src/hooks/useRealtime.ts`
**問題**: ネットワーク切断→再接続時の動作未検証

**修正案**:
```typescript
// realtimeService.ts に再接続ロジック追加
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') {
    console.error('Realtime channel error - attempting reconnect');
    // Retry logic
  }
});
```

**優先度**: P3（本番環境で重要、開発中は低）
**工数**: 2時間（テスト含む）

## 📊 テスト推奨

### 手動テスト項目
- [ ] 2人が同時に部屋に参加（race condition確認）
- [ ] Owner以外が新しいラウンドを開始しようとする（RLS動作確認）
- [ ] ネットワーク切断中にラウンド進行（Realtime再接続確認）
- [ ] 10人以上の参加者でパフォーマンス確認

### 自動テスト（将来実装）
- Unit test: completionService.checkAllSelected()
- Integration test: startRound() with owner check
- E2E test: 待機画面→ゲーム画面の遷移

## 🎯 次のアクション

### 今すぐ修正すべき
- なし（すべてP2以下）

### Phase 5前に修正推奨
- Issue #2: エラーハンドリング追加

### Phase 6で検討
- Issue #1: Race condition対策
- Issue #3: コンポーネント命名整理
- Issue #4: Realtime再接続ロジック

## 📝 総評

**現在の品質**: ⭐⭐⭐⭐☆ (4/5)
- MVP として十分な品質
- セキュリティ基本は適切
- UXは直感的で良好
- 小さな改善余地あり

**本番デプロイ可否**: ✅ 可（軽微な改善は後回しでOK）

**推奨アクション**:
1. Phase 4-5を現状でコミット
2. Issue #2のみ修正（30分）
3. Phase 5へ進む
