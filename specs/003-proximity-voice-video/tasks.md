# Tasks: Proximity Voice & Video

**Input**: Design documents from `/specs/003-proximity-voice-video/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/livekit-token-endpoint.md, contracts/proximity-volume-function.md, quickstart.md.
Also depends on feature 002's synced `AvatarState` positions being available client-side.

**Tests**: Included for the pure `proximityVolume` function only, per research.md (no
automated tests of real WebRTC media).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [P] Add the `livekit-client` dependency to `apps/client/package.json`
- [X] T002 [P] Add the `livekit-server-sdk` dependency to `apps/server/package.json`
- [X] T003 [P] Document required `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
      environment variables (matching the dev compose file's fixed values) in
      `apps/server/.env.example`. No code needed to load it — `colyseus` re-exports
      `@colyseus/tools`, which already auto-loads `.env.development`/`.env` (via `dotenv`) as
      a side effect of import, confirmed by the "optional .env file not found" log line
      `apps/server`'s `pnpm dev` already prints on startup.
- [X] T004 [P] Create `docker-compose.livekit.yml` at the repository root: a LiveKit dev
      server with fixed dev API key/secret and mapped ports (HTTP/WS + RTC TCP/UDP), per the
      constitution's local development environment requirement. Uses `livekit-server`'s
      built-in `--dev` mode (in-memory, fixed `devkey`/`secret` keys — no official
      docker-compose example exists in LiveKit's docs, confirmed by checking, so this
      composes the plain `--dev` docker-run flags researched instead); `--bind 0.0.0.0` is
      required for the host port mapping to reach the signal server (default bind is
      loopback-only inside the container) and `--node-ip 127.0.0.1` is correct for local dev
      where every participant connects via localhost. Pins the image to `v1.13.5` rather than
      `latest`, for a reproducible dev environment. Validated end-to-end (both the initial
      `latest` pull and, after pinning, `v1.13.5`): `docker compose -f
      docker-compose.livekit.yml up`, confirmed the logged ports/keys/node IP match, and
      `curl localhost:7880` returned 200.
- [X] T005 [P] Add the `valibot` dependency to `apps/server/package.json` (request-body
      validation, per constitution Principle V). Already present from spec 002 — no change
      needed.

**Checkpoint**: `docker compose -f docker-compose.livekit.yml up` starts a local LiveKit
server; dependencies installed; env var contract documented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Implement the `POST /livekit-token` endpoint in
      `apps/server/src/http/livekit-token.ts`: validate the request body with a Valibot
      schema, then mint a token per `contracts/livekit-token-endpoint.md` (depends on T002,
      T003, T005). Express 5 ships no bundled types, so `@types/express` had to be added as a
      dev dependency for this file to typecheck (undocumented prerequisite, not called out in
      this task's file list — same kind of gap as spec 002 T009's `tsconfig` decorator note).
      Validated end-to-end against a locally running LiveKit dev server: a well-formed request
      returns a signed JWT + the configured URL, and both a missing field and an empty string
      correctly return 400 without reaching token-minting.
- [X] T007 Mount the token route on the existing HTTP server in `apps/server/src/index.ts`
      (depends on T006). Uses `Server`'s documented `options.express` callback, which Colyseus
      invokes with the same Express app instance the transport itself uses (`Server.attach()`
      in `@colyseus/core`) — not a second, separate app.
- [X] T008 [P] Implement the `proximityVolume` pure function per
      `contracts/proximity-volume-function.md` in `apps/client/src/lib/av/proximity-volume.ts`
      (depends on T001)
- [X] T009 Implement a `ProximityAudioController` skeleton — fetches a token from
      `/livekit-token` and connects to the single shared LiveKit room — in
      `apps/client/src/lib/av/proximity-audio-controller.ts` (depends on T001, T007). The
      token-fetch half is validated against the real endpoint (above); `room.connect()` itself
      needs real browser WebRTC (`livekit-client` targets the browser, not Node) and is
      manually validated later, per this feature's established pattern of deferring anything
      requiring real media to `quickstart.md` (research.md).

**Checkpoint**: Client can obtain a token and connect to the local LiveKit room (T004); no
volume logic yet.

---

## Phase 3: User Story 1 - Talk to whoever is nearby, automatically (Priority: P1) 🎯 MVP

**Goal**: Perceived volume of each nearby participant ramps with distance, per constitution
Principle II (single room, client-side attenuation only).

**Independent Test**: Two participants with mics enabled, far apart → walk together → confirm
audio ramps in; walk apart → confirm it ramps out (spec.md SC-001, SC-002).

### Tests for User Story 1

- [X] T010 [P] [US1] Unit test `proximityVolume`: `1` at distance 0, `0` at/after the range
      threshold, monotonically non-increasing in between, in
      `apps/client/tests/unit/proximity-volume.spec.ts` (depends on T008)

### Implementation for User Story 1

- [X] T011 [US1] Compute per-remote-participant distance each frame by matching LiveKit
      participant `identity` to the corresponding synced `AvatarState` position (feature 002),
      in `proximity-audio-controller.ts` (depends on T009). Implemented together with T012 in
      one `update(localPosition, remotePositions)` method, called once per frame by whichever
      caller wires this controller into the scene (not yet done as of this phase — no task in
      this file assigns that integration, tracked separately). `remotePositions` is a plain
      `ReadonlyMap<sessionId, AvatarPosition>` supplied by the caller rather than this class
      reaching into `RoomConnection` itself, keeping it decoupled from Colyseus specifics
      (FR-009's system-independence intent) while still letting position data flow one-way in,
      as FR-002 requires.
- [X] T012 [US1] Apply `proximityVolume(distance, hearingRangePx)` to each remote
      participant's LiveKit audio track each frame, in `proximity-audio-controller.ts` (depends
      on T011, T008). `HEARING_RANGE_PX` is a fixed 200px constant (~6 tiles at feature 001's
      32px tiles) — spec.md Assumptions calls this "tuned during implementation," not derived
      from anything else.
- [X] T013 [US1] Skip establishing the local participant's proximity connection until their
      own avatar has a valid synced position (FR-008), in `proximity-audio-controller.ts`
      (depends on T009). Enforced at the type level rather than a runtime check: `connect()`
      now requires a `localPosition: AvatarPosition` argument, so there is no way to call it
      before a position exists to pass in.

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - See video and control your own mic/camera (Priority: P2)

**Goal**: Nearby participants' video appears near their avatar; each participant can mute/
unmute and toggle their own camera; a muted indicator is visible to others.

**Independent Test**: With two avatars close together (Story 1 audio already working), enable
one's camera and confirm the other sees it; mute one and confirm the other stops hearing them
plus sees the indicator (spec.md acceptance scenarios for Story 2).

### Implementation for User Story 2

- [ ] T014 [US2] Implement `MediaControls` (own mic mute/unmute, camera on/off) in
      `apps/client/src/lib/av/media-controls.ts` (depends on T009)
- [ ] T015 [US2] Implement `avatar-video-overlay.svelte`: render `<video>` tiles positioned at
      each nearby avatar's current screen-space coordinates for participants with camera
      enabled, styled with a plain scoped `<style>` block (no CSS framework, per constitution
      Principle V) (depends on T009; reads screen position from feature 001's camera/scene)
- [ ] T016 [US2] Render a muted indicator on nearby avatars, driven by LiveKit's
      `isMicrophoneEnabled` per participant (FR-006), in `avatar-video-overlay.svelte` or a
      sibling component (depends on T009)
- [ ] T017 [US2] Wire `MediaControls`' mute/camera-toggle UI into the page in
      `apps/client/src/routes/+page.svelte` (depends on T014)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Participate gracefully without a mic or camera (Priority: P3)

**Goal**: Denied permission or missing hardware never blocks movement/presence; the person
simply transmits no audio/video of their own.

**Independent Test**: Deny the permission prompt on join and confirm movement/seeing/hearing
others still fully works (spec.md SC-003).

### Implementation for User Story 3

- [ ] T018 [US3] Handle `getUserMedia`/LiveKit-publish failure (permission denied or no
      device) without blocking the room connection itself, in
      `proximity-audio-controller.ts` (depends on T009)
- [ ] T019 [US3] Make `MediaControls` reflect a "no device / denied" state by disabling the
      relevant toggle rather than erroring, in `media-controls.ts` (depends on T014, T018)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T020 Run `quickstart.md` validation scenarios end-to-end manually with two real
      devices/browsers, including the multi-participant and independence-from-movement-sync
      edge cases
- [ ] T021 [P] Review `proximity-audio-controller.ts` against constitution Principle II —
      confirm no per-distance track subscribe/unsubscribe logic was introduced (only volume
      changes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on the LiveKit connection existing (T009) but is independently testable.
  - US3 (P3) depends on the LiveKit connection existing (T009) but is independently testable
    and can be developed in parallel with US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001–T005 (Setup) run in parallel.
- T008 (pure function) can be built in parallel with T006–T007 (server endpoint).
- US2 and US3 can be worked on in parallel once Foundational + US1 are done, since both only
  depend on T009/T014, not on each other.

## Parallel Example: Setup

```bash
Task: "Add the livekit-client dependency to apps/client/package.json"
Task: "Add the livekit-server-sdk dependency to apps/server/package.json"
Task: "Document required LiveKit environment variables in apps/server/.env.example"
Task: "Create docker-compose.livekit.yml at the repository root"
Task: "Add the valibot dependency to apps/server/package.json"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (including `docker compose up` for LiveKit)
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` scenarios 1–3 with two real browsers/devices
5. Combined with features 001–002, this delivers the headline "walk close, hear them" loop

### Incremental Delivery

1. Setup + Foundational → local LiveKit running, token endpoint + connection ready
2. US1 → validate independently → demo (proximity audio ramps with distance)
3. US2 → validate independently → demo (video + self mute/camera controls)
4. US3 → validate independently → demo (works even without a mic/camera)

## Notes

- Total tasks: 21 (T001–T021)
- Per-story breakdown: Setup 5, Foundational 4, US1 4, US2 4, US3 2, Polish 2
- Suggested MVP scope: Phase 3 (User Story 1) only, on top of features 001–002
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
