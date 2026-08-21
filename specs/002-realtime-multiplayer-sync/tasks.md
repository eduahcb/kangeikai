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

- [X] T001 [P] Scaffold `apps/server` as a new pnpm workspace member (`apps/server/package.json`,
      `apps/server/tsconfig.json`)
- [X] T002 [P] Add Colyseus server dependencies (`colyseus`, `@colyseus/schema`, HTTP
      transport) to `apps/server/package.json`
- [X] T003 [P] Add the Colyseus client SDK dependency to `apps/client/package.json` — used
      `@colyseus/sdk` instead of the `colyseus.js` named in this task: `colyseus.js`'s latest
      published version depends on `@colyseus/schema@^3`, incompatible with the
      `@colyseus/schema@^4` pulled in by the server's `colyseus@0.17` (T002); `@colyseus/sdk`
      is the actively-published successor client package matching that schema major
- [X] T004 [P] Add `@colyseus/testing` as a dev dependency to `apps/server/package.json`
- [X] T005 [P] Add the `valibot` dependency to `apps/server/package.json` (network-message
      validation, per constitution Principle V)

**Checkpoint**: `pnpm install` succeeds; `apps/server` has a runnable (empty) entrypoint.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema and connection scaffolding every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Define `AvatarSchema` (Colyseus `Schema` mirroring `AvatarState` from
      `packages/shared/src/avatar.ts`) in `apps/server/src/rooms/schema/avatar-schema.ts`
      (depends on T002)
- [X] T007 Define `OfficeRoomState` (`players: MapSchema<AvatarSchema>`) in
      `apps/server/src/rooms/schema/office-room-state.ts` (depends on T006)
- [X] T008 [P] Define `officeJoinOptionsSchema` and `updateStatePayloadSchema` (Valibot
      validation schemas for the two client→server message shapes in
      `contracts/office-room-protocol.md`) in `apps/server/src/rooms/message-schemas.ts`
      (depends on T005)
- [X] T009 Implement the server entrypoint — Colyseus app + HTTP server registering the
      `office` room — in `apps/server/src/index.ts` (depends on T007). Also adds a minimal
      `OfficeRoom` skeleton (`apps/server/src/rooms/office-room.ts`, empty `onCreate` only) so
      there's something to register; `@colyseus/schema`'s `@type()` decorators required adding
      `experimentalDecorators`/`useDefineForClassFields` to `apps/server/tsconfig.json`
      (undocumented prerequisite, not called out in this task's file list).
- [X] T010 Implement a `RoomConnection` skeleton (connects to the `office` room with
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

- [X] T011 [P] [US1] Integration test: two simulated clients join and position/direction/
      motion-state changes propagate between them, in
      `apps/server/tests/integration/office-room.spec.ts` (depends on T009). Uses the client
      room's `onStateChange` signal rather than `@colyseus/testing`'s own `waitForNextPatch()`
      helper — that helper is broken against the installed `@colyseus/sdk@0.17.43` (it
      monkey-patches a `Room.prototype.patch` method that no longer exists on that SDK
      version, so its returned promise never resolves).

### Implementation for User Story 1

- [X] T012 [US1] Implement `OfficeRoom.onJoin`: validate `options` with
      `officeJoinOptionsSchema`, then seed a `ParticipantSession`/`avatarState` from
      `spriteType` plus a valid spawn position, in `apps/server/src/rooms/office-room.ts`
      (depends on T007, T008, T009)
- [X] T013 [US1] Implement `OfficeRoom`'s `updateState` message handler: validate the payload
      with `updateStatePayloadSchema` (drop on failure), then write `x`/`y`/`direction`/
      `motionState` into the sender's own schema entry, per
      `contracts/office-room-protocol.md` (depends on T012, T008). Validates manually with
      `v.safeParse` inside the handler rather than passing the schema to Colyseus's built-in
      `onMessage(type, validationSchema, callback)` overload — that overload's failure path
      forcibly disconnects the client (`client.leave()`), contradicting the contract's
      "dropped rather than applied" (connection stays alive) behavior.
- [X] T014 [US1] Implement `RoomConnection.sendState` (throttled on-change, capped ~20/sec) in
      `apps/client/src/lib/network/room-connection.ts` (depends on T010)
- [X] T015 [US1] Wire `RoomConnection`'s remote-state-change events into `OfficeScene` to
      spawn/update remote `Avatar` entities, in
      `apps/client/src/lib/game/scenes/office-scene.ts` (depends on T014; reuses feature 001's
      `Avatar` entity)

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Know who's currently present (Priority: P2)

**Goal**: Avatars appear on join and disappear on clean leave for everyone else.

**Independent Test**: Connect a second client after a first is already connected and confirm
appearance; disconnect it and confirm disappearance (spec.md SC-002).

### Tests for User Story 2

- [X] T016 [P] [US2] Integration test: joining broadcasts a new avatar to already-connected
      clients, and a clean leave removes it, in
      `apps/server/tests/integration/office-room.spec.ts` (depends on T012). Uses a
      predicate-polling `waitFor` helper rather than a single `onStateChange.once()` — the
      join/leave patch isn't guaranteed to be the very next state change observed (e.g. a
      client's own initial full-state sync can land first), so `.once()` could resolve before
      the awaited change actually arrived.

### Implementation for User Story 2

- [X] T017 [US2] Implement `OfficeRoom.onLeave`'s clean-leave path: remove the session from
      `players` in `apps/server/src/rooms/office-room.ts` (depends on T012)
- [X] T018 [US2] Handle remote-avatar removal in `OfficeScene` when a player leaves the synced
      state, in `apps/client/src/lib/game/scenes/office-scene.ts` (depends on T015). Already
      implemented as part of T015 — `RoomConnection`'s `players.onRemove` binding and
      `OfficeScene`'s `onRemoteAvatarRemove`/`removeRemoteAvatar` wiring were built
      generically in Phase 3, not scoped to only the reconnection case.

**Checkpoint**: User Stories 1 and 2 both work independently — full presence awareness.

---

## Phase 5: User Story 3 - Recover from a brief connection drop (Priority: P3)

**Goal**: An ungraceful disconnect enters a reconnection grace period (hidden from other
participants) and resumes seamlessly if the client reconnects in time; otherwise it finalizes
as a full leave.

**Independent Test**: Simulate a brief disconnect and reconnect on one client; confirm it
resumes without a manual reload and other participants see no permanent gap (spec.md SC-004).

### Tests for User Story 3

- [ ] T019 [P] [US3] Integration test: an ungraceful disconnect enters the grace period (session
      excluded from `players`), and reconnecting within the window resumes the same session,
      in `apps/server/tests/integration/office-room.spec.ts` (depends on T017)

### Implementation for User Story 3

- [ ] T020 [US3] Implement `OfficeRoom.onLeave`'s ungraceful-disconnect path: call Colyseus's
      `allowReconnection` with a bounded grace period, excluding the session from `players`
      during the window (FR-005, FR-008), in `apps/server/src/rooms/office-room.ts` (depends
      on T017)
- [ ] T021 [US3] Implement grace-period-timeout finalization: treat an unresolved grace period
      as a full leave (FR-009), in `apps/server/src/rooms/office-room.ts` (depends on T020)
- [ ] T022 [US3] Implement client-side automatic reconnection attempt on connection drop in
      `apps/client/src/lib/network/room-connection.ts` (depends on T014)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T023 Run `quickstart.md` validation scenarios end-to-end manually with two browser
      windows, including the abrupt-disconnect and server-restart edge cases
- [ ] T024 [P] Review `apps/server/src/rooms/office-room.ts` against `data-model.md` validation
      rules (`players` excludes grace-period sessions; `spriteType` immutable post-join) and
      confirm both message handlers actually go through `message-schemas.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (T001–T005 run in parallel with
  each other).
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's `OfficeRoom.onJoin`/session model (T012) but is independently
    testable.
  - US3 (P3) depends on US2's clean-leave path (T017) existing to extend into the ungraceful
    path, but is independently testable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001–T005 (Setup) run in parallel.
- T008 (Valibot schemas) can be built in parallel with T006–T007 (Colyseus Schema) — they're
  unrelated concerns despite both living under `rooms/`.
- T011 (US1 test) can be scaffolded in parallel with T012–T014 (implementation), written
  first per standard TDD ordering.
- T016, T019 similarly can be drafted ahead of their implementation tasks.

## Parallel Example: Setup

```bash
Task: "Scaffold apps/server as a new pnpm workspace member"
Task: "Add Colyseus server dependencies to apps/server/package.json"
Task: "Add the Colyseus client SDK dependency to apps/client/package.json"
Task: "Add @colyseus/testing as a dev dependency to apps/server/package.json"
Task: "Add the valibot dependency to apps/server/package.json"
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

- Total tasks: 24 (T001–T024)
- Per-story breakdown: Setup 5, Foundational 5, US1 5, US2 3, US3 4, Polish 2
- Suggested MVP scope: Phase 3 (User Story 1) only, on top of feature 001
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
