# T086: Room Creator Leaving Edge Case

## 現在の動作
- オーナーが離脱（`is_active = false`）
- 他の参加者は継続可能
- **問題**: 新ラウンド開始ボタンが誰も押せなくなる

## 実装オプション

### Option A: 自動的に次のオーナーを指名（推奨）
**メリット**: ゲーム続行可能、UX良好
**実装**:
```sql
-- 最初にアクティブな参加者を新オーナーに
UPDATE participants
SET is_owner = true
WHERE room_id = :room_id
  AND is_active = true
  AND is_owner = false
ORDER BY created_at
LIMIT 1;
```

### Option B: 全員がラウンド開始可能に変更
**メリット**: シンプル
**デメリット**: 複数人が同時にボタンを押す可能性

### Option C: ルームを終了
**メリット**: 実装簡単
**デメリット**: UX悪い

## 決定
**Phase 6では実装をスキップ**し、Phase 7でOption Aを実装する。

理由:
1. エッジケース中のエッジケース（オーナーが突然離脱するケースは稀）
2. 現状でも致命的ではない（ルームは継続、統計は見える）
3. 実装には追加のRealtime対応が必要（複雑度増）

## 暫定対応
ドキュメントに記載:
> オーナーが離脱した場合、現在のラウンドは完了できますが、新しいラウンドを開始するには再度ルームを作成してください。
