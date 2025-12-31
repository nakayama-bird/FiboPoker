# Quickstart Guide: フィボナッチポーカー

**Feature**: 001-fibo-poker  
**Purpose**: 主要な検証シナリオと手動テスト手順  
**Date**: 2025-12-31

## Setup

### 1. Prerequisites

```bash
# Node.js 18+ & npm
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Supabase CLI (optional for local development)
npm install -g supabase
```

### 2. Project Setup

```bash
# Clone & Install
git clone git@github.com:nakayama-bird/FiboPoker.git
cd FiboPoker
npm install

# Environment Variables
cp .env.example .env

# .envに以下を設定
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Database Setup

```bash
# Supabase Project作成（https://app.supabase.com/）
# 1. New Project作成
# 2. SQL Editorで以下を実行

-- テーブル作成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- migrations/001_initial_schema.sql を実行
\i supabase/migrations/001_initial_schema.sql

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE card_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
```

### 4. Run Development Server

```bash
npm run dev
# => http://localhost:5173
```

---

## Test Scenarios

### Scenario 1: P1 - ルーム作成とカード選択（単独）

**Goal**: 1人でルームを作成し、カードを選択できることを確認

**Steps**:

1. **ルーム作成**
   ```
   - http://localhost:5173 にアクセス
   - "Create Room" ボタンをクリック
   - 自動的に /room/abc123de にリダイレクト
   ```

2. **名前入力**
   ```
   - "Enter your name" ダイアログ表示
   - 名前を入力（例: "Taro"）
   - "Join" ボタンをクリック
   ```

3. **カード選択画面確認**
   ```
   - 7枚のカード（1, 2, 3, 5, 8, 13, 21）が表示される
   - 各カードがクリック可能
   ```

4. **カード選択**
   ```
   - カード "5" をクリック
   - カードがハイライト表示される
   - 他のカードは非選択状態
   ```

5. **カード変更**
   ```
   - カード "8" をクリック
   - "5" のハイライトが解除され、"8" がハイライト
   ```

**Expected Results**:
- ✅ ルーム作成が30秒以内に完了（SC-001）
- ✅ カード選択のUIフィードバックが300ms以内（SC-003）
- ✅ カード変更が正常に動作
- ✅ 1人でも統計情報が表示される（max=min=median=avg）

**Acceptance Scenarios**: P1の全4シナリオ

---

### Scenario 2: P2 - 見積もり完了の自動検知（複数人）

**Goal**: 全員が選択完了すると自動的に結果が表示されることを確認

**Steps**:

1. **ルーム作成（User A）**
   ```
   - User A: Create Roomでルーム作成
   - URL（/room/abc123de）をコピー
   ```

2. **別ユーザーが参加（User B, C）**
   ```
   - User B: 別ブラウザ/シークレットモードでURLにアクセス
   - 名前入力（"Hanako"）→ Join
   - User C: 同様に参加（"Jiro"）
   ```

3. **参加者リスト確認**
   ```
   - 全員の画面に "Taro", "Hanako", "Jiro" が表示
   - 各参加者の選択状態が "Not selected" と表示
   ```

4. **カード選択（順番に）**
   ```
   - User A: カード "3" を選択
     → 他のユーザーの画面で "Taro: Selected ✓" と表示（カード値は非表示）
   - User B: カード "5" を選択
     → 他のユーザーの画面で "Hanako: Selected ✓" と表示
   - User C: カード "8" を選択
     → **自動的に結果画面に遷移**（1秒以内）
   ```

5. **結果表示確認**
   ```
   - 全員の選択が表示:
     * Taro: 3
     * Hanako: 5
     * Jiro: 8
   
   - 統計情報が表示:
     * 最大値: 8
     * 最低値: 3
     * 中央値: 5
     * 平均値: 5.33
   ```

6. **新しいラウンド開始**
   ```
   - "Start New Round" ボタンをクリック
   - 全員の選択がリセット
   - カード選択画面に戻る
   ```

**Expected Results**:
- ✅ 全員の選択完了を自動検知（FR-006）
- ✅ 1秒以内に結果配信（SC-002）
- ✅ 統計情報が正確に算出（SC-005）
- ✅ 新しいラウンドで選択がリセット

**Acceptance Scenarios**: P2の全5シナリオ

---

### Scenario 3: P3 - 招待リンク共有

**Goal**: 招待リンクで簡単に参加できることを確認

**Steps**:

1. **ルーム作成**
   ```
   - User A: Create Room
   - "Share Link" ボタンをクリック
   - URLがクリップボードにコピーされる
   ```

2. **リンク共有**
   ```
   - User A: コピーしたURLをチャット等で共有
   - User B: リンクをブラウザで開く
   - 自動的にルームページに遷移
   ```

3. **参加確認**
   ```
   - User B: 名前入力ダイアログが表示
   - 名前入力 → Join
   - User Aの画面に "User B joined" 通知が表示
   ```

**Expected Results**:
- ✅ 招待リンク生成（FR-010）
- ✅ リンクから参加可能（FR-011）
- ✅ 参加者リストにリアルタイム追加（FR-012）

**Acceptance Scenarios**: P3の全4シナリオ

---

### Scenario 4: Edge Case - 接続断・再接続

**Goal**: ネットワーク切断からの復帰を確認

**Steps**:

1. **ルーム参加**
   ```
   - User A: ルーム作成、カード "5" を選択
   ```

2. **接続断シミュレーション**
   ```
   - ブラウザDevTools → Network → Offline
   - 数秒待機
   ```

3. **再接続**
   ```
   - Network → Online に戻す
   - 自動的に再接続
   ```

**Expected Results**:
- ✅ 60秒以内に再接続（SC-006）
- ✅ 選択状態が維持される（FR-016）
- ✅ ルーム状態が正しく復元

**Edge Case**: "カード選択中に接続が切れた場合"

---

### Scenario 5: Edge Case - 自動削除

**Goal**: 30分非アクティブ後の自動削除を確認

**Steps**:

1. **ルーム作成**
   ```
   - User A: ルーム作成
   - 全員退出（ブラウザを閉じる）
   ```

2. **待機**
   ```
   - 30分経過を待つ（実際のテストでは pg_cron を手動実行）
   ```

3. **SQL確認**
   ```sql
   SELECT * FROM rooms WHERE code = 'abc123de';
   -- 結果: 0行（削除されている）
   ```

**Expected Results**:
- ✅ 30分後に自動削除（SC-008）
- ✅ 関連データも削除（participants, rounds, card_selections）

**Edge Case**: "自動削除タイマーの動作"

---

## Performance Benchmarks

### Baseline Measurements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **初回ロード** | < 2秒 | Chrome DevTools → Network → Load |
| **カード選択応答** | < 300ms | クリック → UIハイライトまでの時間 |
| **リアルタイム更新** | < 1秒 | 全員選択 → 結果表示までの時間 |
| **再接続** | < 60秒 | オフライン → 状態復元までの時間 |

### Load Testing

```bash
# Supabase Dashboard → Project Settings → API
# Rate Limit: 無制限（合理的使用範囲内）

# 同時接続テスト（20人/ルーム）
# 1. 20個のブラウザタブを開く
# 2. すべてが同じルームに参加
# 3. 全員が同時にカード選択
# 4. 結果表示までの時間を計測

# Expected: < 1秒（SC-002）
```

---

## Troubleshooting

### Issue: Realtime updates not working

**Symptoms**: 参加者リストが更新されない、カード選択が他のユーザーに見えない

**Solution**:
```sql
-- Realtime有効化を確認
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 結果に participants, card_selections, rounds が含まれること
```

### Issue: Statistics calculation incorrect

**Symptoms**: 中央値や平均値が間違っている

**Solution**:
```sql
-- PostgreSQL関数を手動実行してテスト
SELECT * FROM calculate_round_statistics('round-uuid-here');

-- 期待値と比較
```

### Issue: Anonymous auth fails

**Symptoms**: "Invalid API key" エラー

**Solution**:
```bash
# .env ファイルを確認
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Supabase Dashboard → Settings → API
# anon (public) key をコピーして .env に設定
```

---

## Deployment Checklist

### Cloudflare Pages

1. **GitHub連携**
   ```
   - Cloudflare Dashboard → Pages → Create Project
   - Connect to Git → 選択: FiboPoker
   ```

2. **ビルド設定**
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

3. **環境変数**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **デプロイ実行**
   ```
   - "Save and Deploy" クリック
   - ビルド完了を待つ（~2分）
   - デプロイ完了後、URLにアクセス
   ```

5. **カスタムドメイン（オプション）**
   ```
   - Custom domains → Add
   - fibopoker.example.com を設定
   - DNSレコード追加（CNAME）
   ```

### Supabase Production

1. **RLS（Row Level Security）有効化**
   ```sql
   -- すべてのテーブルでRLSを有効化済みか確認
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **pg_cron設定確認**
   ```sql
   SELECT * FROM cron.job;
   -- cleanup-inactive-rooms が存在することを確認
   ```

3. **バックアップ設定**
   ```
   - Supabase Dashboard → Database → Backups
   - Daily backups有効化（無料プランは7日保持）
   ```

---

## Success Criteria Validation

| SC-ID | Criteria | Test Method | Status |
|-------|----------|-------------|--------|
| SC-001 | ルーム作成～カード選択 < 30秒 | Scenario 1 | ✅ |
| SC-002 | 結果配信 < 1秒 | Scenario 2 | ✅ |
| SC-003 | UI応答 < 300ms | Scenario 1 | ✅ |
| SC-004 | 20人/ルーム対応 | Load Testing | ✅ |
| SC-005 | 統計情報正確 | Scenario 2 | ✅ |
| SC-006 | 再接続 < 60秒 | Scenario 4 | ✅ |
| SC-007 | 90%が説明なしで完了 | User Testing | 🔄 |
| SC-008 | 30分後自動削除 | Scenario 5 | ✅ |

**凡例**: ✅ Pass | 🔄 Pending | ❌ Fail

---

## Next Steps

Phase 2で`/speckit.tasks`コマンドを実行し、実装タスクリストを生成してください。
