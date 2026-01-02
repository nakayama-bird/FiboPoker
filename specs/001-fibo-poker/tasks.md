---
description: "Task list for Fibonacci Poker implementation"
---

# Tasks: フィボナッチポーカーアプリケーション

**Feature**: 001-fibo-poker  
**Input**: Design documents from [/specs/001-fibo-poker/](.)  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-contracts.md](contracts/api-contracts.md)

**Tests**: テストタスクは**含まれません**（仕様に明示的な要求がないため）。必要に応じてPhase 7で追加可能。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テスト可能です。

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 並行実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（US1, US2, US3）
- 説明には正確なファイルパスを含めます

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクト初期化と基本構造

- [X] T001 Create Vite + React + TypeScript project structure per [plan.md](plan.md)
- [X] T002 Install dependencies: react@18.3, react-router-dom@6.21, @supabase/supabase-js@2.39, vite@5.0
- [X] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [X] T004 [P] Configure Vite build settings in vite.config.ts
- [X] T005 [P] Setup CSS Modules configuration in vite.config.ts
- [X] T006 Create .env.example with Supabase URL and ANON_KEY placeholders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーが依存するコアインフラストラクチャ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリーの作業は開始できません

### Supabase Setup

- [X] T007 Create Supabase project and obtain URL + ANON_KEY
- [X] T008 Create database migration file: supabase/migrations/001_initial_schema.sql
- [X] T009 [P] Define rooms table with uuid, code, status, timestamps in migration
- [X] T010 [P] Define participants table with room_id FK, session_id, display_name in migration
- [X] T011 [P] Define rounds table with room_id FK, round_number, status, statistics in migration
- [X] T012 [P] Define card_selections table with round_id FK, participant_id FK, card_value CHECK constraint in migration
- [X] T013 Create update_updated_at_column() trigger function in migration
- [X] T014 Create calculate_round_statistics() function per [data-model.md](data-model.md) in migration
- [X] T015 Create cleanup_inactive_rooms() function in supabase/functions/cleanup_inactive_rooms.sql
- [X] T016 Apply migration to Supabase project and verify schema
- [X] T017 Configure Row Level Security (RLS) policies per [data-model.md](data-model.md)
- [X] T018 Enable Realtime for participants, card_selections, rounds tables

### Application Foundation

- [X] T019 Create Supabase client in src/services/supabase.ts with env variables
- [X] T020 [P] Create TypeScript types from database schema in src/types/database.ts
- [X] T021 [P] Setup React Router with /room/:code route in src/App.tsx
- [X] T022 [P] Create base layout component in src/components/Layout.tsx
- [X] T023 [P] Create error boundary component in src/components/ErrorBoundary.tsx

**Checkpoint**: 基盤準備完了 - ユーザーストーリーの実装を並行開始可能

---

## Phase 3: User Story 1 - ルーム作成とカード選択 (Priority: P1) 🎯 MVP

**Goal**: ユーザーはルームを作成し、フィボナッチ数列のカードから1つを選択して見積もりを行えます

**Independent Test**: 1人のユーザーが新しいルームを作成し、カード（1, 2, 3, 5, 8, 13, 21）から1つを選択し、自分の選択を確認できることで独立してテスト可能です（[spec.md](spec.md) US1参照）

### Room Management for US1

- [X] T024 [P] [US1] Create roomService.createRoom() in src/services/roomService.ts (implements FR-001, FR-002)
- [X] T025 [P] [US1] Create roomService.getRoomByCode() in src/services/roomService.ts
- [X] T026 [P] [US1] Create useRoom() custom hook in src/hooks/useRoom.ts
- [X] T027 [US1] Create HomePage component with "Create Room" button in src/components/HomePage.tsx
- [X] T028 [US1] Implement room creation flow: button click → API call → redirect to /room/:code (SC-001: 30秒以内)

### Participant Management for US1

- [X] T029 [P] [US1] Implement Supabase Anonymous Auth in src/services/supabase.ts
- [X] T030 [P] [US1] Create participantService.joinRoom() in src/services/participantService.ts (implements FR-011)
- [X] T031 [US1] Create display name input component in src/components/DisplayNameInput.tsx
- [X] T032 [US1] Integrate display name input in RoomPage on first visit

### Round & Card Selection for US1

- [X] T033 [P] [US1] Create roundService.startRound() in src/services/roundService.ts
- [X] T034 [P] [US1] Create cardSelectionService.selectCard() in src/services/cardSelectionService.ts (implements FR-004)
- [X] T035 [P] [US1] Create cardSelectionService.updateCard() for changing selection (implements FR-005)
- [X] T036 [P] [US1] Create CardSelector component with Fibonacci cards (1,2,3,5,8,13,21) in src/components/CardSelector.tsx (implements FR-003)
- [X] T037 [US1] Create RoomPage component structure with state management in src/components/RoomPage.tsx
- [X] T038 [US1] Integrate CardSelector into RoomPage with selection handling
- [X] T039 [US1] Implement visual highlight for selected card (SC-003: 300ms応答)
- [X] T040 [US1] Add card change functionality: clicking another card updates selection

### Styling for US1

- [X] T041 [P] [US1] Create CSS Module for HomePage in src/styles/HomePage.module.css
- [X] T042 [P] [US1] Create CSS Module for CardSelector in src/styles/CardSelector.module.css
- [X] T043 [P] [US1] Create CSS Module for RoomPage in src/styles/RoomPage.module.css

**Checkpoint**: この時点で、User Story 1が完全に機能し独立してテスト可能です

---

## Phase 4: User Story 2 - 見積もり完了の自動検知と結果表示 (Priority: P2)

**Goal**: 全員がカードを選択完了した時点で自動的に検知され、統計情報（最大値、最低値、中央値、平均値）とともに結果が一斉に表示されます

**Independent Test**: 複数ユーザーが同じルームに参加し、全員がカードを選択すると、自動的に結果が表示され、最大値、最低値、中央値、平均値が正しく算出されることで独立してテスト可能です（[spec.md](spec.md) US2参照）

### Realtime Foundation for US2

- [X] T044 [P] [US2] Create realtimeService.subscribeToParticipants() in src/services/realtimeService.ts
- [X] T045 [P] [US2] Create realtimeService.subscribeToCardSelections() in src/services/realtimeService.ts
- [X] T046 [P] [US2] Create realtimeService.subscribeToRounds() in src/services/realtimeService.ts
- [X] T047 [P] [US2] Create useRealtime() custom hook in src/hooks/useRealtime.ts
- [X] T048 [US2] Integrate useRealtime into RoomPage for live updates

### Completion Detection for US2

- [X] T049 [US2] Implement client-side completion detection logic in RoomPage (implements FR-006)
- [X] T050 [US2] Create completionService.checkAllSelected() in src/services/completionService.ts
- [X] T051 [US2] Trigger calculate_round_statistics() PostgreSQL function on completion
- [X] T052 [US2] Update rounds.status to 'revealed' after statistics calculation

### Results Display for US2

- [X] T053 [P] [US2] Create ResultsView component in src/components/ResultsView.tsx (implements FR-009)
- [X] T054 [P] [US2] Create StatisticsDisplay component for max/min/median/avg in src/components/StatisticsDisplay.tsx (implements FR-008)
- [X] T055 [P] [US2] Create ParticipantCards component showing all selections in src/components/ParticipantCards.tsx
- [X] T056 [US2] Integrate ResultsView into RoomPage with state-driven switching
- [X] T057 [US2] Ensure results delivery within 1 second of completion (implements FR-007, SC-002)

### New Round for US2

- [X] T058 [P] [US2] Create "Start New Round" button component in src/components/NewRoundButton.tsx
- [X] T059 [US2] Implement new round flow: button → roundService.startRound() → reset UI to selecting state (implements FR-014)
- [X] T060 [US2] Clear previous card selections on new round start

### Styling for US2

- [ ] T061 [P] [US2] Create CSS Module for ResultsView in src/styles/ResultsView.module.css
- [ ] T062 [P] [US2] Create CSS Module for StatisticsDisplay in src/styles/StatisticsDisplay.module.css
- [ ] T063 [P] [US2] Create CSS Module for ParticipantCards in src/styles/ParticipantCards.module.css

**Checkpoint**: この時点で、User Stories 1 と 2 の両方が独立して動作します

---

## Phase 5: User Story 3 - メンバー招待とルーム共有 (Priority: P3)

**Goal**: ルーム作成者は他のメンバーを招待でき、招待されたメンバーはルームに参加して見積もりに参加できます

**Independent Test**: ルーム作成者が招待リンクを生成し、そのリンクを使って他のユーザーがルームに参加できることで独立してテスト可能です（[spec.md](spec.md) US3参照）

### Invitation Link for US3

- [X] T064 [P] [US3] Create InvitationLink component with copy-to-clipboard in src/components/InvitationLink.tsx (implements FR-010)
- [X] T065 [P] [US3] Add share button UI with copy confirmation toast
- [X] T066 [US3] Integrate InvitationLink into RoomPage header
- [X] T067 [US3] Implement URL generation: window.location.origin + /room/:code

### Participant List for US3

- [X] T068 [P] [US3] Create ParticipantList component in src/components/ParticipantList.tsx (implements FR-012)
- [X] T069 [P] [US3] Display participant display_name and is_active status
- [X] T070 [P] [US3] Show "選択済み" indicator for participants who have selected cards (implements FR-013)
- [X] T071 [US3] Integrate ParticipantList into RoomPage sidebar
- [X] T072 [US3] Subscribe to participants table Realtime updates for live participant list

### Multi-User Synchronization for US3

- [X] T073 [US3] Ensure card selection status updates in real-time for all participants (SC-002)
- [X] T074 [US3] Test multi-user scenario: 2+ users selecting cards simultaneously
- [X] T075 [US3] Validate completion detection works with multiple participants

### Styling for US3

- [X] T076 [P] [US3] Create CSS Module for InvitationLink in src/styles/InvitationLink.module.css
- [X] T077 [P] [US3] Create CSS Module for ParticipantList in src/styles/ParticipantList.module.css

**Checkpoint**: すべてのユーザーストーリーが独立して機能します

---

## Phase 6: Edge Cases & Reconnection

**Purpose**: エッジケース処理とネットワーク障害対応

### Reconnection Logic

- [x] T078 [P] Implement Supabase automatic reconnection handling (implements FR-015)
- [x] T079 [P] Create reconnection indicator component in src/components/ReconnectionIndicator.tsx
- [x] T080 Restore room state on reconnection: fetch current round + selections (implements FR-016)
- [x] T081 Validate reconnection within 60 seconds restores user state (SC-006)

### Edge Case Handling

- [x] T082 [P] Handle single participant scenario: display statistics when only 1 user (Edge Case 1)
- [x] T083 [P] Handle unanimous selection: highlight when all cards are the same (Edge Case 2)
- [x] T084 [P] Handle even participant count: calculate median correctly (Edge Case 3)
- [x] T085 [P] Handle participant leaving before reveal: recalculate statistics (Edge Case 5)
- [x] T086 Handle room creator leaving: room continues for remaining participants (Edge Case 6)

### Auto-Deletion

- [ ] T087 Verify pg_cron job executes cleanup_inactive_rooms() every 5 minutes
- [ ] T088 Test auto-deletion: room deleted 30 minutes after all participants leave (implements FR-017, SC-008)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

### Performance Optimization

- [ ] T089 [P] Optimize Vite build for production: code splitting, minification
- [ ] T090 [P] Implement optimistic UI updates for card selection (SC-003: 300ms)
- [ ] T091 Validate initial load time < 2 seconds (Performance Goal)
- [ ] T092 Validate realtime update delivery < 1 second (SC-002)

### User Experience

- [ ] T093 [P] Add loading states for all async operations
- [ ] T094 [P] Add error handling with user-friendly messages
- [ ] T095 [P] Implement accessibility: ARIA labels, keyboard navigation
- [ ] T096 Validate 90% of users complete room creation without instruction (SC-007)

### Documentation & Deployment

- [ ] T097 [P] Create README.md with project setup instructions
- [ ] T098 [P] Document environment variables in .env.example
- [ ] T099 [P] Create deployment guide for Cloudflare Pages in docs/deployment.md
- [ ] T100 Configure Cloudflare Pages: connect GitHub repo, set build command
- [ ] T101 Add Supabase environment variables to Cloudflare Pages settings
- [ ] T102 Deploy to production and verify all features work

### Validation

- [ ] T103 Run all scenarios from [quickstart.md](quickstart.md)
- [ ] T104 Validate all Success Criteria (SC-001 through SC-008)
- [ ] T105 Validate all Functional Requirements (FR-001 through FR-017)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **Foundational (Phase 2)**: Setup完了後 - すべてのユーザーストーリーをBLOCK
- **User Stories (Phase 3-5)**: すべてFoundational完了後に開始可能
  - 十分な人員があれば並行実行可能
  - または優先順位順に逐次実行（P1 → P2 → P3）
- **Edge Cases (Phase 6)**: US1, US2, US3完了後
- **Polish (Phase 7)**: すべての必要なユーザーストーリー完了後

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後に開始可能 - 他ストーリーへの依存なし
- **User Story 2 (P2)**: Foundational完了後に開始可能 - US1と統合するが独立してテスト可能
- **User Story 3 (P3)**: Foundational完了後に開始可能 - US1/US2と統合するが独立してテスト可能

### Within Each User Story

- モデル/サービス → コンポーネント → 統合
- コア実装 → スタイリング
- ストーリー完了後、次の優先度へ移行

### Parallel Opportunities

#### Phase 1 (Setup)
```bash
# T003, T004, T005, T006 can run in parallel
parallel ::: \
  "T003: Configure TypeScript" \
  "T004: Configure Vite" \
  "T005: Setup CSS Modules" \
  "T006: Create .env.example"
```

#### Phase 2 (Foundational)
```bash
# T009-T012 (database tables) can run in parallel
parallel ::: \
  "T009: Define rooms table" \
  "T010: Define participants table" \
  "T011: Define rounds table" \
  "T012: Define card_selections table"

# T020-T023 (app foundation) can run in parallel after T019
parallel ::: \
  "T020: Create database types" \
  "T021: Setup React Router" \
  "T022: Create Layout component" \
  "T023: Create ErrorBoundary"
```

#### Phase 3 (User Story 1)
```bash
# T024-T026 (room services) can run in parallel
parallel ::: \
  "T024: createRoom()" \
  "T025: getRoomByCode()" \
  "T026: useRoom() hook"

# T029-T030 (participant services) can run in parallel
parallel ::: \
  "T029: Anonymous Auth" \
  "T030: joinRoom()"

# T033-T036 (round/card services) can run in parallel
parallel ::: \
  "T033: startRound()" \
  "T034: selectCard()" \
  "T035: updateCard()" \
  "T036: CardSelector component"

# T041-T043 (styling) can run in parallel
parallel ::: \
  "T041: HomePage CSS" \
  "T042: CardSelector CSS" \
  "T043: RoomPage CSS"
```

#### Phase 4 (User Story 2)
```bash
# T044-T047 (realtime services) can run in parallel
parallel ::: \
  "T044: subscribeToParticipants()" \
  "T045: subscribeToCardSelections()" \
  "T046: subscribeToRounds()" \
  "T047: useRealtime() hook"

# T053-T055 (results components) can run in parallel
parallel ::: \
  "T053: ResultsView component" \
  "T054: StatisticsDisplay component" \
  "T055: ParticipantCards component"

# T061-T063 (styling) can run in parallel
parallel ::: \
  "T061: ResultsView CSS" \
  "T062: StatisticsDisplay CSS" \
  "T063: ParticipantCards CSS"
```

#### Phase 5 (User Story 3)
```bash
# T064-T065 (invitation components) can run in parallel
parallel ::: \
  "T064: InvitationLink component" \
  "T065: Share button UI"

# T068-T070 (participant list) can run in parallel
parallel ::: \
  "T068: ParticipantList component" \
  "T069: Display name/status" \
  "T070: Selection indicator"

# T076-T077 (styling) can run in parallel
parallel ::: \
  "T076: InvitationLink CSS" \
  "T077: ParticipantList CSS"
```

#### Phase 6 (Edge Cases)
```bash
# T078-T079, T082-T086 can run in parallel
parallel ::: \
  "T078: Reconnection handling" \
  "T079: Reconnection indicator" \
  "T082: Single participant edge case" \
  "T083: Unanimous selection edge case" \
  "T084: Even participant median" \
  "T085: Participant leaving edge case" \
  "T086: Room creator leaving edge case"
```

#### Phase 7 (Polish)
```bash
# T089-T090, T093-T095, T097-T099 can run in parallel
parallel ::: \
  "T089: Optimize Vite build" \
  "T090: Optimistic UI updates" \
  "T093: Loading states" \
  "T094: Error handling" \
  "T095: Accessibility" \
  "T097: README.md" \
  "T098: Document env vars" \
  "T099: Deployment guide"
```

### Critical Path (Sequential Dependencies)

**Must be sequential**:
1. Phase 1 (Setup) → Phase 2 (Foundational)
2. Phase 2 → Phase 3, 4, 5 can start
3. T007 (Create Supabase project) → T008-T018 (migrations)
4. T008 (migration file) → T016 (apply migration)
5. T019 (Supabase client) → T020-T023 (app foundation)
6. T027 (HomePage) → T028 (room creation flow)
7. T037 (RoomPage structure) → T038-T040 (integrate CardSelector)
8. T048 (integrate useRealtime) → T049-T052 (completion detection)
9. T056 (integrate ResultsView) → T057 (validate 1s delivery)

---

## Implementation Strategy

### MVP First Approach

**Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1)** = Minimum Viable Product

- **Week 1**: Setup + Foundational (T001-T023)
- **Week 2**: User Story 1 (T024-T043)
- **Week 3**: User Story 2 (T044-T063)
- **Week 4**: User Story 3 (T064-T077) + Edge Cases (T078-T088)
- **Week 5**: Polish (T089-T105) + Deployment

### Incremental Delivery

1. **Milestone 1 (MVP)**: US1のみ - 単独ユーザーでルーム作成・カード選択可能
2. **Milestone 2**: US1 + US2 - リアルタイム結果表示機能追加
3. **Milestone 3**: US1 + US2 + US3 - 完全な招待・共有機能
4. **Milestone 4**: すべてのエッジケース対応
5. **Milestone 5**: 本番デプロイ

### Validation Points

- **US1完了時**: [quickstart.md](quickstart.md) Scenario 1実行
- **US2完了時**: [quickstart.md](quickstart.md) Scenario 2実行
- **US3完了時**: [quickstart.md](quickstart.md) Scenario 3実行
- **Phase 6完了時**: [quickstart.md](quickstart.md) Scenario 4-5実行
- **Phase 7完了時**: すべてのSC（SC-001〜SC-008）検証

---

## Summary

- **Total Tasks**: 105
- **User Story 1 (P1)**: 20 tasks (T024-T043) - MVP
- **User Story 2 (P2)**: 20 tasks (T044-T063)
- **User Story 3 (P3)**: 14 tasks (T064-T077)
- **Setup + Foundational**: 23 tasks (T001-T023)
- **Edge Cases**: 11 tasks (T078-T088)
- **Polish**: 17 tasks (T089-T105)

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel within their phases

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 43 tasks

**Constitution Compliance**: ✅ All tasks align with 7 constitution principles validated in [plan.md](plan.md)
