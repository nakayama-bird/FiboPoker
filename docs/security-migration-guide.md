# セキュリティ改善マイグレーション適用手順

## 📋 概要

`002_security_improvements.sql` を Supabase に適用する手順です。

## 🚨 重要な注意事項

このマイグレーションは**既存のポリシーを削除**して新しいものに置き換えます。
**本番環境に適用する前に、必ずテスト環境で動作確認してください。**

## ⚠️ 影響範囲

### 変更されるポリシー

#### rooms テーブル
- ❌ 削除: "Allow all to read/insert/update rooms"
- ✅ 追加: 参加者のみ読み取り可能、オーナーのみ更新・削除可能

#### participants テーブル
- ❌ 削除: "Allow all to read/insert/update participants"
- ✅ 追加: 同じルームの参加者のみ読み取り可能、自分のレコードのみ操作可能

#### rounds テーブル
- ❌ 削除: "Allow all to read/insert/update rounds"
- ✅ 追加: 同じルームの参加者のみ読み取り可能、オーナーのみ作成・更新可能

#### card_selections テーブル
- ✅ 既存のポリシーは維持（既に適切）
- ✅ 追加: 自分の選択のみ削除可能

### 追加される制約
- `display_name`: 1-50文字制限
- `room_code`: 8文字の小文字英数字のみ

## 📝 適用手順

### 方法1: Supabase Dashboard（推奨）

1. https://supabase.com/ にログイン
2. プロジェクトを選択
3. 左メニュー「SQL Editor」をクリック
4. 「New query」をクリック
5. `supabase/migrations/002_security_improvements.sql` の内容を全てコピー
6. ペーストして「Run」をクリック

### 方法2: Supabase CLI（開発環境）

```bash
# Supabase CLIがインストールされている場合
supabase db push

# または直接実行
supabase db reset
```

## ✅ 動作確認

マイグレーション適用後、以下を確認：

### 1. ポリシーの確認

```sql
-- rooms テーブルのポリシー
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'rooms';

-- 4つのポリシーが表示されるはず:
-- - Users can read rooms they participate in
-- - Anyone can create rooms
-- - Owners can update their rooms
-- - Owners can delete their rooms
```

### 2. 制約の確認

```sql
-- display_name制約
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'participants'::regclass 
AND conname = 'display_name_length';

-- room_code制約
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'rooms'::regclass 
AND conname = 'room_code_format';
```

### 3. アプリケーションテスト

- [ ] 新しいルームを作成できる
- [ ] ルームに参加できる
- [ ] 他のルームのデータが見えない（重要！）
- [ ] 自分のカード選択のみ変更できる
- [ ] オーナーのみラウンドを開始できる

## 🔙 ロールバック

問題が発生した場合、以下のSQLで元に戻せます：

```sql
-- 新しいポリシーを削除
DROP POLICY IF EXISTS "Users can read rooms they participate in" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can update their rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can delete their rooms" ON rooms;

DROP POLICY IF EXISTS "Users can read participants in their rooms" ON participants;
DROP POLICY IF EXISTS "Users can join rooms" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON participants;

DROP POLICY IF EXISTS "Users can read rounds in their rooms" ON rounds;
DROP POLICY IF EXISTS "Room owners can create rounds" ON rounds;
DROP POLICY IF EXISTS "Room owners can update rounds" ON rounds;

DROP POLICY IF EXISTS "Users can delete their own card_selections" ON card_selections;

-- 元のポリシーを再作成（001_initial_schema.sqlから）
CREATE POLICY "Allow all to read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow all to insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all to update rooms" ON rooms FOR UPDATE USING (true);
-- ... (続く)
```

## 📊 期待される効果

### セキュリティ向上
- ✅ 他人のルームへの不正アクセス防止
- ✅ なりすまし防止（auth.uid()ベース）
- ✅ オーナー権限の適切な制御

### パフォーマンス
- ⚠️ わずかな遅延が発生する可能性（RLSチェックのオーバーヘッド）
- ✅ 影響は通常10ms以下

## 🎯 次のステップ

1. ✅ このマイグレーションを適用
2. ⬜ T112: 複数ユーザーでテスト
3. ⬜ T113-T114: 追加のセキュリティ対策（CORS制限など）

## ❓ トラブルシューティング

### エラー: "policy already exists"

→ 既に同名のポリシーが存在する場合。`DROP POLICY` 部分を先に実行してください。

### エラー: "constraint already exists"

→ 既に同名の制約が存在する場合。以下で確認：

```sql
SELECT conname FROM pg_constraint WHERE conrelid = 'participants'::regclass;
```

### アプリが動かない

1. ブラウザのコンソールを確認（認証エラーがないか）
2. Supabase Dashboard > Logs > Postgres Logs で RLS エラーを確認
3. 一時的にポリシーを無効化してテスト：

```sql
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
-- テスト後
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
```
