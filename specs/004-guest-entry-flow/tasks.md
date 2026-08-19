# Tasks: Guest Entry Flow

**Input**: Design documents from `/specs/004-guest-entry-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/guest-profile-handoff.md, quickstart.md. Also depends on
`packages/shared/src/avatar.ts` (`AvatarSpriteType`) from feature 001.

**Tests**: Included for all pure logic (validation, default-name, storage wrapper), per
research.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Define entry-flow constants (`MAX_NAME_LENGTH`, the `localStorage` key, the
      default-name wordlists) in `apps/client/src/lib/entry/constants.ts`

**Checkpoint**: Constants available for the rest of the feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Implement `isValidName`, `clampName`, `isValidAvatarType`,
      `fallbackAvatarType` pure functions in `apps/client/src/lib/entry/validation.ts`
      (depends on T001)
- [ ] T003 [P] Implement `generateDefaultName()` pure function in
      `apps/client/src/lib/entry/defaultName.ts` (depends on T001)
- [ ] T004 Implement `GuestProfileStore` (`load()`/`save()`, wrapping `localStorage` in
      `try/catch`, using `validation.ts`) in
      `apps/client/src/lib/entry/GuestProfileStore.ts` (depends on T002, T003)

**Checkpoint**: Storage/validation layer ready; no UI yet.

---

## Phase 3: User Story 1 - Join as a guest with a name and avatar (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor can enter a name, pick an avatar type, and enter the shared
space; an empty name is blocked.

**Independent Test**: Open with no prior local data, fill in a name, pick an avatar, confirm,
and verify entry succeeds with that identity (spec.md SC-001, SC-003).

### Tests for User Story 1

- [ ] T005 [P] [US1] Unit test `isValidName`/`clampName`: rejects empty/whitespace-only,
      enforces `MAX_NAME_LENGTH` (FR-002, FR-003), in
      `apps/client/tests/unit/entry-validation.spec.ts` (depends on T002)

### Implementation for User Story 1

- [ ] T006 [US1] Implement `EntryForm.svelte`: name input, avatar-type picker, confirm
      button, blocking submission on an invalid name (FR-002), in
      `apps/client/src/lib/entry/EntryForm.svelte` (depends on T004)
- [ ] T007 [US1] Wire `+page.svelte` to render `EntryForm` before mounting the game scene,
      passing the confirmed `displayName`/`avatarType` down per
      `contracts/guest-profile-handoff.md` (FR-009), in `apps/client/src/routes/+page.svelte`
      (depends on T006; integrates with feature 001's existing `+page.svelte`)

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Remembered locally for next time (Priority: P2)

**Goal**: A returning visitor's previous name/avatar choice is pre-filled; changing and
re-confirming updates what's stored.

**Independent Test**: Complete Story 1's flow once, reload, and confirm the form is pre-filled
with the same choice (spec.md SC-002).

### Tests for User Story 2

- [ ] T008 [P] [US2] Unit test `GuestProfileStore.save()`/`load()` round-trip via a mocked
      `localStorage`, in `apps/client/tests/unit/guest-profile-store.spec.ts` (depends on T004)

### Implementation for User Story 2

- [ ] T009 [US2] Pre-fill `EntryForm` from `GuestProfileStore.load()` on mount (depends on
      T004, T006)
- [ ] T010 [US2] Call `GuestProfileStore.save()` on successful confirm, replacing any prior
      stored profile (depends on T004, T007)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Quick entry with a sensible default name (Priority: P3)

**Goal**: A first-time visitor sees a non-blank default display name pre-filled.

**Independent Test**: Open with no prior local data and confirm the name field is pre-filled,
not empty (spec.md Acceptance Scenario for Story 3).

### Tests for User Story 3

- [ ] T011 [P] [US3] Unit test `generateDefaultName()` always returns a non-blank string, in
      `apps/client/tests/unit/entry-validation.spec.ts` (depends on T003)

### Implementation for User Story 3

- [ ] T012 [US3] Use `generateDefaultName()` to pre-fill `EntryForm`'s name field when
      `GuestProfileStore.load()` returns no stored profile (depends on T003, T009)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Unit test `GuestProfileStore` falls back to "no stored profile" behavior when
      `localStorage.getItem`/`setItem` throws or is absent (FR-007), in
      `apps/client/tests/unit/guest-profile-store.spec.ts`
- [ ] T014 [P] Unit test `GuestProfileStore` falls back to a valid `avatarType` when the
      stored value is missing or invalid (FR-008), in
      `apps/client/tests/unit/guest-profile-store.spec.ts`
- [ ] T015 Run `quickstart.md` validation scenarios end-to-end manually, including the
      corrupted-storage and storage-unavailable edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's `EntryForm`/`+page.svelte` wiring (T006, T007) existing, but is
    independently testable.
  - US3 (P3) depends on US2's pre-fill wiring (T009) existing (to know when there's "nothing
    to pre-fill from"), but is independently testable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T002 and T003 (Foundational) run in parallel.
- T005 (US1 test) can be drafted in parallel with T006–T007 (implementation).
- T013 and T014 (Polish) run in parallel with each other.

## Parallel Example: Foundational

```bash
Task: "Implement isValidName, clampName, isValidAvatarType, fallbackAvatarType in apps/client/src/lib/entry/validation.ts"
Task: "Implement generateDefaultName() in apps/client/src/lib/entry/defaultName.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` scenarios 1–3
5. Combined with features 001–003, this closes the loop: enter with a name/avatar, walk
   around, talk to nearby people

### Incremental Delivery

1. Setup + Foundational → validation/storage layer ready
2. US1 → validate independently → demo (can enter with name + avatar)
3. US2 → validate independently → demo (remembered next visit)
4. US3 → validate independently → demo (default name speeds up first visit)

## Notes

- Total tasks: 15 (T001–T015)
- Per-story breakdown: Setup 1, Foundational 3, US1 3, US2 3, US3 2, Polish 3
- Suggested MVP scope: Phase 3 (User Story 1) only, on top of features 001–003
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
