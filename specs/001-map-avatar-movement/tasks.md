# Tasks: Map, Avatar & Movement

**Input**: Design documents from `/specs/001-map-avatar-movement/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/avatar-state.md,
quickstart.md

**Tests**: Included for the deterministic movement/collision logic, per the testing approach
chosen in research.md (Vitest, no automated rendering assertions at MVP stage).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the monorepo, client app, and repo-wide tooling — this is the first
feature implemented, so it creates the shared scaffolding later features (002–004) will build
on and are expected to already comply with.

- [ ] T001 Initialize the pnpm workspace at the repository root (`package.json` with
      `"packageManager": "pnpm@..."`, `pnpm-workspace.yaml` listing `apps/*` and `packages/*`)
- [ ] T002 [P] Scaffold the `apps/client` SvelteKit app with TypeScript in `apps/client/`
- [ ] T003 Configure `apps/client` for SPA mode: set `adapter-static` (with a SPA fallback
      page) in `apps/client/svelte.config.js` and disable server-side rendering globally via
      `export const ssr = false` in `apps/client/src/routes/+layout.ts` (depends on T002)
- [ ] T004 [P] Scaffold the `packages/shared` package (`packages/shared/package.json`,
      `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`) and add it as a
      workspace dependency of `apps/client`
- [ ] T005 [P] Add the Phaser.js dependency to `apps/client/package.json`
- [ ] T006 [P] Configure Vitest for `apps/client` (`apps/client/vitest.config.ts`)
- [ ] T007 [P] Create `AGENTS.md` at the repository root as the single source of truth for
      AI coding-agent instructions (universal, tool-agnostic, per constitution Principle V)
- [ ] T008 Create `CLAUDE.md` at the repository root containing only an `@AGENTS.md` import,
      for Claude Code compatibility (depends on T007)
- [ ] T009 Configure ESLint at the repository root using `@antfu/eslint-config`
      (`eslint.config.js`) — no Prettier, per constitution Principle V (depends on T002, so
      the config can detect the Svelte/TypeScript project it's linting). Also enable
      `unicorn/filename-case` set to `kebabCase` for source files, with an `ignores` override
      for SvelteKit's reserved route filenames (`+page.svelte`, `+layout.ts`, `+server.ts`,
      etc.), which are framework-mandated and not subject to the convention
- [ ] T010 Configure `lint-staged` at the repository root (`.lintstagedrc.json`) to run
      `eslint --fix` on staged files (depends on T009)
- [ ] T011 Configure a `simple-git-hooks`-managed `pre-commit` hook that runs `lint-staged`,
      wired via the `"simple-git-hooks"` field in the root `package.json` (depends on T010)

**Checkpoint**: `pnpm install` succeeds, `apps/client` boots an empty SvelteKit dev server in
SPA mode, `pnpm build` produces a static output with no server-rendered HTML, `pnpm lint`
runs cleanly, and committing a staged file with a lint error is blocked by the pre-commit hook.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and the base page/scene that every user story below depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T012 Define `AvatarDirection`, `AvatarMotionState`, `AvatarSpriteType`, `AvatarState`
      types in `packages/shared/src/avatar.ts` per `contracts/avatar-state.md`
- [ ] T013 [P] Add the Tiled map export and tileset image at
      `apps/client/src/lib/assets/maps/office.json` and
      `apps/client/src/lib/assets/maps/office-tileset.png`, including a dedicated collision
      layer per `data-model.md` (`MapDefinition.collisionLayer`)
- [ ] T014 [P] Add avatar sprite sheets at
      `apps/client/src/lib/assets/sprites/avatar-man.png` and
      `apps/client/src/lib/assets/sprites/avatar-woman.png`
- [ ] T015 Create `apps/client/src/routes/+page.svelte` that mounts an empty `Phaser.Game`
      instance in `onMount` (depends on T003 — with SSR disabled globally there's no server
      render to guard against; `onMount` is purely about waiting for the canvas's DOM element
      to exist)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Move freely around the space (Priority: P1) 🎯 MVP

**Goal**: The local avatar renders on the shared map and moves in four directions via
keyboard, blocked by the map's obstacles.

**Independent Test**: Load the page alone, confirm the map and avatar render, confirm
keyboard movement works and is blocked by every obstacle on the map (spec.md SC-001, SC-003).

### Tests for User Story 1

- [ ] T016 [P] [US1] Unit test: opposing directional keys resolve to a single consistent
      direction (FR-008) in `apps/client/tests/unit/movement-controller.spec.ts`
- [ ] T017 [P] [US1] Unit test: movement stops when input focus is lost (FR-009) in
      `apps/client/tests/unit/movement-controller.spec.ts`

### Implementation for User Story 1

- [ ] T018 [US1] Implement `MovementController` (keyboard input → movement intent, opposing-
      key resolution, focus-loss handling) in
      `apps/client/src/lib/game/input/movement-controller.ts` (depends on T015)
- [ ] T019 [US1] Implement the `Avatar` entity (position, applies movement intent, exposes
      `AvatarState`) in `apps/client/src/lib/game/entities/avatar.ts` (depends on T012, T015)
- [ ] T020 [US1] Implement `OfficeScene`: load the Tiled map + collision layer, spawn the
      local `Avatar` at a valid position in
      `apps/client/src/lib/game/scenes/office-scene.ts` (depends on T013, T019)
- [ ] T021 [US1] Wire collision between the `Avatar` and the map's collision layer in
      `office-scene.ts` so obstacles block movement (FR-004) (depends on T020)
- [ ] T022 [US1] Wire `MovementController` into `OfficeScene`'s update loop so keyboard input
      drives the `Avatar` (depends on T018, T020)

**Checkpoint**: User Story 1 fully functional and independently testable — this alone is a
demonstrable slice ("I can walk around the office").

---

## Phase 4: User Story 2 - See the avatar reflect direction and motion (Priority: P2)

**Goal**: The avatar visually faces its direction of travel and animates while walking,
returning to an idle pose when stopped.

**Independent Test**: Move in each of the four directions and confirm the sprite faces that
direction and animates; stop and confirm it returns to idle (spec.md Acceptance Scenarios
1–2 for Story 2).

### Implementation for User Story 2

- [ ] T023 [P] [US2] Define walk/idle animation frames for each of the four directions on the
      `Avatar` entity in `apps/client/src/lib/game/entities/avatar.ts` (depends on T014, T019)
- [ ] T024 [US2] Update `Avatar.direction`/`motionState` from `MovementController` input each
      frame and drive animation playback accordingly (FR-005) (depends on T018, T023)

**Checkpoint**: User Stories 1 and 2 both work independently — movement now reads clearly.

---

## Phase 5: User Story 3 - Keep the avatar in view on a larger map (Priority: P3)

**Goal**: The camera follows the avatar and stays clamped to the map's bounds, and recomputes
correctly on window resize.

**Independent Test**: Walk from the center toward each map edge and confirm the viewport
scrolls and stops exactly at the map boundary; resize the window near an edge and confirm the
avatar stays visible (spec.md Acceptance Scenarios for Story 3, SC-004).

### Implementation for User Story 3

- [ ] T025 [US3] Configure the Phaser camera's bounds to the map's pixel dimensions and call
      `startFollow(avatar)` in `office-scene.ts` (FR-006) (depends on T020)
- [ ] T026 [US3] Handle browser window resize to recompute the viewport/camera size in
      `office-scene.ts` (Edge Case: resize near a map edge) (depends on T025)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T027 Run `quickstart.md` validation scenarios end-to-end manually and record results
- [ ] T028 [P] Review `apps/client/src/lib/game/` code against `data-model.md` validation
      rules (spawn point never inside collision layer, `spriteType` restricted to the two
      defined values)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's `MovementController`/`Avatar` existing (T018, T019) but is its
    own independently testable increment.
  - US3 (P3) depends on US1's `OfficeScene` existing (T020) but is independently testable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T002, T004–T007 (Setup) can run in parallel (independent files/concerns).
- T003 depends on T002; T009 depends on T002 and can run parallel with T004–T008.
- T008 depends on T007; T010 depends on T009; T011 depends on T010 (sequential tooling
  chain: AGENTS.md → CLAUDE.md, and ESLint → lint-staged → pre-commit hook).
- T013–T014 (Foundational assets) can run in parallel.
- T016–T017 (US1 tests) can run in parallel.
- T023 (US2) can start in parallel with US1's later tasks once T014/T019 are done.

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Unit test opposing-key resolution in apps/client/tests/unit/movement-controller.spec.ts"
Task: "Unit test focus-loss stop in apps/client/tests/unit/movement-controller.spec.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` scenarios 1–3, 5–6
5. This alone is a demoable slice of the Kangeikai MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → validate independently → demo ("walk around the office")
3. US2 → validate independently → demo (movement reads clearly)
4. US3 → validate independently → demo (works on a map bigger than the screen)

## Notes

- Total tasks: 28 (T001–T028)
- Per-story breakdown: Setup 11, Foundational 4, US1 7, US2 2, US3 2, Polish 2
- Suggested MVP scope: Phase 3 (User Story 1) only
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
