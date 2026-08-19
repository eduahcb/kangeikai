# Tasks: Realtime Multiplayer Sync

**Input**: Design documents from `/specs/002-realtime-multiplayer-sync/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/office-room-protocol.md, quickstart.md. Also depends on feature 001's
`packages/shared/src/avatar.ts` and `apps/client` scene/entities already existing.

**Tests**: Included via `@colyseus/testing` integration tests, per research.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the server app to the existing monorepo (feature 001 already created the
pnpm workspace root and `apps/client`).

- [ ] T001 [P] Scaffold `apps/server` as a new pnpm workspace member (`apps/server/package.json`,
      `apps/server/tsconfig.json`)
- [ ] T002 [P] Add Colyseus server dependencies (`colyseus`, `@colyseus/schema`, HTTP
      transport) to `apps/server/package.json`
- [ ] T003 [P] Add the Colyseus client SDK dependency (`colyseus.js`) to
      `apps/client/package.json`
- [ ] T004 [P] Add `@colyseus/testing` as a dev dependency to `apps/server/package.json`

**Checkpoint**: `pnpm install` succeeds; `apps/server` has a runnable (empty) entrypoint.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema and connection scaffolding every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Define `AvatarSchema` (Colyseus `Schema` mirroring `AvatarState` from
      `packages/shared/src/avatar.ts`) in `apps/server/src/rooms/schema/avatar-schema.ts`
      (depends on T002)
- [ ] T006 Define `OfficeRoomState` (`players: MapSchema<AvatarSchema>`) in
      `apps/server/src/rooms/schema/OfficeRoomState.ts` (depends on T005)
- [ ] T007 Implement the server entrypoint — Colyseus app + HTTP server registering the
      `office` room — in `apps/server/src/index.ts` (depends on T006)
- [ ] T008 Implement a `RoomConnection` skeleton (connects to the `office` room with
      `OfficeJoinOptions`, exposes connection-state events) in
      `apps/client/src/lib/network/room-connection.ts` (depends on T003)

**Checkpoint**: Server boots and accepts a client join with no state sync logic yet.

---

## Phase 3: User Story 1 - See other people move in real time (Priority: P1) 🎯 MVP

**Goal**: Two connected participants see each other's position, direction, and motion state
update live.

**Independent Test**: Two simulated/real clients join; moving one is observed by the other in
near real time (spec.md SC-001).

### Tests for User Story 1

- [ ] T009 [P] [US1] Integration test: two simulated clients join and position/direction/
      motion-state changes propagate between them, in
      `apps/server/tests/integration/office-room.spec.ts` (depends on T007)

### Implementation for User Story 1

- [ ] T010 [US1] Implement `OfficeRoom.onJoin`: seed a `ParticipantSession`/`avatarState` from
      `OfficeJoinOptions.spriteType` plus a valid spawn position, in
      `apps/server/src/rooms/office-room.ts` (depends on T006, T007)
- [ ] T011 [US1] Implement `OfficeRoom`'s `updateState` message handler: write
      `x`/`y`/`direction`/`motionState` into the sender's own schema entry, per
      `contracts/office-room-protocol.md` (depends on T010)
- [ ] T012 [US1] Implement `RoomConnection.sendState` (throttled on-change, capped ~20/sec) in
      `apps/client/src/lib/network/room-connection.ts` (depends on T008)
- [ ] T013 [US1] Wire `RoomConnection`'s remote-state-change events into `OfficeScene` to
      spawn/update remote `Avatar` entities, in
      `apps/client/src/lib/game/scenes/office-scene.ts` (depends on T012; reuses feature 001's
      `Avatar` entity)

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Know who's currently present (Priority: P2)

**Goal**: Avatars appear on join and disappear on clean leave for everyone else.

**Independent Test**: Connect a second client after a first is already connected and confirm
appearance; disconnect it and confirm disappearance (spec.md SC-002).

### Tests for User Story 2

- [ ] T014 [P] [US2] Integration test: joining broadcasts a new avatar to already-connected
      clients, and a clean leave removes it, in
      `apps/server/tests/integration/office-room.spec.ts` (depends on T010)

### Implementation for User Story 2

- [ ] T015 [US2] Implement `OfficeRoom.onLeave`'s clean-leave path: remove the session from
      `players` in `apps/server/src/rooms/office-room.ts` (depends on T010)
- [ ] T016 [US2] Handle remote-avatar removal in `OfficeScene` when a player leaves the synced
      state, in `apps/client/src/lib/game/scenes/office-scene.ts` (depends on T013)

**Checkpoint**: User Stories 1 and 2 both work independently — full presence awareness.

---

## Phase 5: User Story 3 - Recover from a brief connection drop (Priority: P3)

**Goal**: An ungraceful disconnect enters a reconnection grace period (hidden from other
participants) and resumes seamlessly if the client reconnects in time; otherwise it finalizes
as a full leave.

**Independent Test**: Simulate a brief disconnect and reconnect on one client; confirm it
resumes without a manual reload and other participants see no permanent gap (spec.md SC-004).

### Tests for User Story 3

- [ ] T017 [P] [US3] Integration test: an ungraceful disconnect enters the grace period (session
      excluded from `players`), and reconnecting within the window resumes the same session,
      in `apps/server/tests/integration/office-room.spec.ts` (depends on T015)

### Implementation for User Story 3

- [ ] T018 [US3] Implement `OfficeRoom.onLeave`'s ungraceful-disconnect path: call Colyseus's
      `allowReconnection` with a bounded grace period, excluding the session from `players`
      during the window (FR-005, FR-008), in `apps/server/src/rooms/office-room.ts` (depends
      on T015)
- [ ] T019 [US3] Implement grace-period-timeout finalization: treat an unresolved grace period
      as a full leave (FR-009), in `apps/server/src/rooms/office-room.ts` (depends on T018)
- [ ] T020 [US3] Implement client-side automatic reconnection attempt on connection drop in
      `apps/client/src/lib/network/room-connection.ts` (depends on T012)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T021 Run `quickstart.md` validation scenarios end-to-end manually with two browser
      windows, including the abrupt-disconnect and server-restart edge cases
- [ ] T022 [P] Review `apps/server/src/rooms/office-room.ts` against `data-model.md` validation
      rules (`players` excludes grace-period sessions; `spriteType` immutable post-join)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (parallel to nothing since it's
  first, but T001–T004 run in parallel with each other).
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's `OfficeRoom.onJoin`/session model (T010) but is independently
    testable.
  - US3 (P3) depends on US2's clean-leave path (T015) existing to extend into the ungraceful
    path, but is independently testable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001–T004 (Setup) run in parallel.
- T009 (US1 test) can be scaffolded in parallel with T010–T012 (implementation), written
  first per standard TDD ordering.
- T014, T017 similarly can be drafted ahead of their implementation tasks.

## Parallel Example: Setup

```bash
Task: "Scaffold apps/server as a new pnpm workspace member"
Task: "Add Colyseus server dependencies to apps/server/package.json"
Task: "Add the Colyseus client SDK dependency to apps/client/package.json"
Task: "Add @colyseus/testing as a dev dependency to apps/server/package.json"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` scenarios 1–2 with two browser windows
5. Combined with feature 001, this is a demoable "walk around and see each other move" slice

### Incremental Delivery

1. Setup + Foundational → server and connection scaffolding ready
2. US1 → validate independently → demo (movement sync)
3. US2 → validate independently → demo (join/leave presence)
4. US3 → validate independently → demo (resilient to wifi blips)

## Notes

- Total tasks: 22 (T001–T022)
- Per-story breakdown: Setup 4, Foundational 4, US1 5, US2 3, US3 4, Polish 2
- Suggested MVP scope: Phase 3 (User Story 1) only, on top of feature 001
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
