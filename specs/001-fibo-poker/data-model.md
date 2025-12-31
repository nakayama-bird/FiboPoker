# Data Model: フィボナッチポーカー

**Feature**: 001-fibo-poker  
**Database**: Supabase PostgreSQL  
**Date**: 2025-12-31

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   rooms     │────1:N──│  participants    │────1:N──│ card_selections  │
└─────────────┘         └──────────────────┘         └──────────────────┘
       │                                                        │
       │                                                        │
       └────────────────────1:N──────────────────────┬─────────┘
                                                      │
                                              ┌───────────────┐
                                              │    rounds     │
                                              └───────────────┘
```

---

## 1. rooms テーブル

**Purpose**: 見積もりセッション（ルーム）を管理

```sql
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(8) UNIQUE NOT NULL,  -- 短縮URL用コード (例: "abc123de")
  status varchar(20) NOT NULL DEFAULT 'active',  -- 'active' | 'archived'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_updated_at ON rooms(updated_at);

-- 自動更新タイムスタンプ
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Attributes**:
- `id`: UUID主キー
- `code`: 8文字の短縮コード（URL共有用: `/room/abc123de`）
- `status`: ルーム状態（active=使用中、archived=終了）
- `created_at`: 作成日時
- `updated_at`: 最終更新日時（自動削除判定に使用）

**Business Rules**:
- `code`は一意（URLで重複不可）
- `updated_at`が30分以上前 かつ 参加者0人の場合、自動削除対象

---

## 2. participants テーブル

**Purpose**: ルーム参加者を管理

```sql
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,  -- Supabase Anonymous Auth UUID
  display_name varchar(50) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_participants_session_id ON participants(session_id);

-- 制約: 同じルーム内で同一session_idは1件のみ
CREATE UNIQUE INDEX idx_participants_unique ON participants(room_id, session_id);
```

**Attributes**:
- `id`: UUID主キー
- `room_id`: ルームID（外部キー）
- `session_id`: Supabase Anonymous AuthのユーザーUUID
- `display_name`: 表示名（ユーザーが入力）
- `is_active`: アクティブフラグ（退出時はfalse）
- `created_at`: 参加日時

**Business Rules**:
- `room_id`削除時にカスケード削除（ルーム削除→参加者も削除）
- 同一ルーム内で`session_id`重複不可（再参加時は既存レコード更新）
- `display_name`は最大50文字

---

## 3. rounds テーブル

**Purpose**: ラウンド（1回の見積もりサイクル）を管理

```sql
CREATE TABLE rounds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'selecting',  -- 'selecting' | 'revealed'
  max_value integer,
  min_value integer,
  median_value numeric(5,2),
  avg_value numeric(5,2),
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_rounds_room_id ON rounds(room_id);

-- 制約: 同じルーム内でround_numberは一意
CREATE UNIQUE INDEX idx_rounds_unique ON rounds(room_id, round_number);
```

**Attributes**:
- `id`: UUID主キー
- `room_id`: ルームID（外部キー）
- `round_number`: ラウンド番号（1, 2, 3, ...）
- `status`: ラウンド状態（selecting=選択中、revealed=結果表示）
- `max_value`: 最大値（結果表示時に算出）
- `min_value`: 最低値
- `median_value`: 中央値
- `avg_value`: 平均値
- `revealed_at`: 結果表示日時
- `created_at`: ラウンド開始日時

**Business Rules**:
- `round_number`は1から始まる連番
- `status='revealed'`時に統計値（max/min/median/avg）を算出
- ルーム削除時にカスケード削除

---

## 4. card_selections テーブル

**Purpose**: 参加者のカード選択を記録

```sql
CREATE TABLE card_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  card_value integer NOT NULL CHECK (card_value IN (1, 2, 3, 5, 8, 13, 21)),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_card_selections_round_id ON card_selections(round_id);
CREATE INDEX idx_card_selections_participant_id ON card_selections(participant_id);

-- 制約: 同一ラウンドで同一参加者は1回のみ選択可能
CREATE UNIQUE INDEX idx_card_selections_unique ON card_selections(round_id, participant_id);
```

**Attributes**:
- `id`: UUID主キー
- `round_id`: ラウンドID（外部キー）
- `participant_id`: 参加者ID（外部キー）
- `card_value`: 選択したカード値（1, 2, 3, 5, 8, 13, 21のみ）
- `created_at`: 選択日時

**Business Rules**:
- `card_value`はフィボナッチ数列の値のみ（CHECK制約）
- 同一ラウンド内で同一参加者は1回のみ選択可能（UNIQUE制約）
- ラウンド削除時にカスケード削除

---

## Database Functions

### 1. 統計情報算出関数

```sql
CREATE OR REPLACE FUNCTION calculate_round_statistics(p_round_id uuid)
RETURNS void AS $$
DECLARE
  v_max integer;
  v_min integer;
  v_median numeric;
  v_avg numeric;
BEGIN
  SELECT 
    max(card_value),
    min(card_value),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY card_value),
    avg(card_value)
  INTO v_max, v_min, v_median, v_avg
  FROM card_selections
  WHERE round_id = p_round_id;
  
  UPDATE rounds
  SET 
    max_value = v_max,
    min_value = v_min,
    median_value = v_median,
    avg_value = v_avg,
    status = 'revealed',
    revealed_at = now()
  WHERE id = p_round_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. 非アクティブルーム削除関数

```sql
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE updated_at < now() - interval '30 minutes'
    AND (SELECT COUNT(*) FROM participants WHERE room_id = rooms.id AND is_active = true) = 0;
END;
$$ LANGUAGE plpgsql;

-- pg_cronで5分ごとに実行
SELECT cron.schedule(
  'cleanup-inactive-rooms',
  '*/5 * * * *',
  'SELECT cleanup_inactive_rooms();'
);
```

### 3. updated_atカラム自動更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Realtime Configuration

Supabase Realtimeで監視するテーブル:

```sql
-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE card_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
```

**監視イベント**:
- `participants`: INSERT（新規参加）、UPDATE（is_active変更）
- `card_selections`: INSERT（カード選択）
- `rounds`: UPDATE（status='revealed'に変更）

---

## Row Level Security (RLS)

```sql
-- participants: セッションIDが一致するレコードのみ更新可能
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own participant record"
  ON participants FOR INSERT
  WITH CHECK (auth.uid() = session_id);

CREATE POLICY "Users can view all participants in their room"
  ON participants FOR SELECT
  USING (true);

-- card_selections: 自分の選択のみ挿入可能
ALTER TABLE card_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own card selection"
  ON card_selections FOR INSERT
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE session_id = auth.uid()
    )
  );

CREATE POLICY "Users can view all card selections in revealed rounds"
  ON card_selections FOR SELECT
  USING (
    round_id IN (
      SELECT id FROM rounds WHERE status = 'revealed'
    )
  );
```

---

## Migration Order

1. `rooms`
2. `participants`
3. `rounds`
4. `card_selections`
5. Functions (`calculate_round_statistics`, `cleanup_inactive_rooms`, `update_updated_at_column`)
6. Triggers (`update_rooms_updated_at`)
7. RLS Policies
8. Realtime Configuration

**すべてのテーブルはカスケード削除設定済み** → ルーム削除で関連データも自動削除
