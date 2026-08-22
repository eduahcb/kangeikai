# Tasks: Guest Entry Flow

**Input**: Design documents from `/specs/004-guest-entry-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/guest-profile-handoff.md, quickstart.md. Also depends on
`packages/shared/src/avatar.ts` (`AvatarSpriteType`) from feature 001.

**Tests**: Included for all pure logic (schema, default-name, storage wrapper), per
research.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Define entry-flow constants (`MAX_NAME_LENGTH`, the `localStorage` key, the
      default-name wordlists) in `apps/client/src/lib/entry/constants.ts`. Chose
      `MAX_NAME_LENGTH = 24`, storage key `kangeikai:guest-profile`, and two small
      (8-word) adjective/noun lists for `generateDefaultName()` (T004) to combine with a
      number.
- [X] T002 [P] Add the `valibot` dependency to `apps/client/package.json` (`^1.4.2`, matching
      `apps/server`'s existing version)

**Checkpoint**: Constants and Valibot available for the rest of the feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Implement `displayNameSchema`, `avatarTypeSchema` (strict Valibot field
      schemas), and `guestProfileSchema` (lenient, with per-field `v.fallback()` — see
      research.md) in `apps/client/src/lib/entry/guest-profile-schema.ts` (depends on T001,
      T002). Resolves a data-model.md/quickstart.md conflict over overlong names (confirmed
      with the user): `displayNameSchema` clamps to `MAX_NAME_LENGTH` via `v.transform()`
      rather than rejecting via `v.maxLength()` — only empty/whitespace-only still blocks
      (`v.minLength(1)`), per quickstart.md's Edge Case scenario 8. Smoke-tested the fallback
      behavior directly (see also T005's note on the one Valibot quirk found): valid input
      passes through, an overlong name clamps, an empty/invalid field falls back per-field
      while a valid sibling field is preserved, and a `null` blob fails `v.safeParse()`
      outright.
- [X] T004 [P] Implement `generateDefaultName()` pure function in
      `apps/client/src/lib/entry/default-name.ts` (depends on T001). Combines a random
      adjective + noun + 2-digit number, e.g. "Quiet Fox 42".
- [X] T005 Implement `GuestProfileStore` (`load()`/`save()`, wrapping `localStorage` in
      `try/catch`, parsing loaded data via `guestProfileSchema`) in
      `apps/client/src/lib/entry/guest-profile-store.ts` (depends on T003, T004). Valibot
      quirk found while smoke-testing: `v.object()` accepts a stored *array* as structurally
      valid (`typeof [] === 'object'`) rather than failing outright as data-model.md describes
      for "not an object at all" — but every field is then missing, so both fall back exactly
      as if there were no stored profile at all. Net observable behavior for `load()` still
      matches the spec's intent (treated as first-time visitor); not worth a stricter check to
      reject arrays explicitly, since the outcome is already identical.

**Checkpoint**: Storage/validation layer ready; no UI yet.

---

## Phase 3: User Story 1 - Join as a guest with a name and avatar (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor can enter a name, pick an avatar type, and enter the shared
space; an empty name is blocked.

**Independent Test**: Open with no prior local data, fill in a name, pick an avatar, confirm,
and verify entry succeeds with that identity (spec.md SC-001, SC-003).

### Tests for User Story 1

- [ ] T006 [P] [US1] Unit test `displayNameSchema`/`avatarTypeSchema`: rejects empty/
      whitespace-only, enforces `MAX_NAME_LENGTH` (FR-002, FR-003), in
      `apps/client/tests/unit/guest-profile-schema.spec.ts` (depends on T003)

### Implementation for User Story 1

- [ ] T007 [US1] Implement `entry-form.svelte`: name input, avatar-type picker, confirm
      button, blocking submission on an invalid name via `displayNameSchema`/`avatarTypeSchema`
      (FR-002), plain scoped `<style>` (no CSS framework, per constitution Principle V), in
      `apps/client/src/lib/entry/entry-form.svelte` (depends on T005)
- [ ] T008 [US1] Wire `+page.svelte` to render `EntryForm` before mounting the game scene,
      passing the confirmed `displayName`/`avatarType` down per
      `contracts/guest-profile-handoff.md` (FR-009), in `apps/client/src/routes/+page.svelte`
      (depends on T007; integrates with feature 001's existing `+page.svelte`)

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Remembered locally for next time (Priority: P2)

**Goal**: A returning visitor's previous name/avatar choice is pre-filled; changing and
re-confirming updates what's stored.

**Independent Test**: Complete Story 1's flow once, reload, and confirm the form is pre-filled
with the same choice (spec.md SC-002).

### Tests for User Story 2

- [ ] T009 [P] [US2] Unit test `GuestProfileStore.save()`/`load()` round-trip via a mocked
      `localStorage`, in `apps/client/tests/unit/guest-profile-store.spec.ts` (depends on T005)

### Implementation for User Story 2

- [ ] T010 [US2] Pre-fill `EntryForm` from `GuestProfileStore.load()` on mount (depends on
      T005, T007)
- [ ] T011 [US2] Call `GuestProfileStore.save()` on successful confirm, replacing any prior
      stored profile (depends on T005, T008)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Quick entry with a sensible default name (Priority: P3)

**Goal**: A first-time visitor sees a non-blank default display name pre-filled.

**Independent Test**: Open with no prior local data and confirm the name field is pre-filled,
not empty (spec.md Acceptance Scenario for Story 3).

### Tests for User Story 3

- [ ] T012 [P] [US3] Unit test `generateDefaultName()` always returns a non-blank string, in
      `apps/client/tests/unit/default-name.spec.ts` (depends on T004)

### Implementation for User Story 3

- [ ] T013 [US3] Use `generateDefaultName()` to pre-fill `EntryForm`'s name field when
      `GuestProfileStore.load()` returns no stored profile (depends on T004, T010)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Unit test `GuestProfileStore` falls back to "no stored profile" behavior when
      `localStorage.getItem`/`setItem` throws or is absent (FR-007), in
      `apps/client/tests/unit/guest-profile-store.spec.ts`
- [ ] T015 [P] Unit test `GuestProfileStore` falls back to a valid `avatarType` while
      preserving an otherwise-valid stored `displayName` (FR-008, exercising
      `guestProfileSchema`'s per-field `v.fallback()`), in
      `apps/client/tests/unit/guest-profile-store.spec.ts`
- [ ] T016 Run `quickstart.md` validation scenarios end-to-end manually, including the
      corrupted-storage and storage-unavailable edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's `EntryForm`/`+page.svelte` wiring (T007, T008) existing, but is
    independently testable.
  - US3 (P3) depends on US2's pre-fill wiring (T010) existing (to know when there's "nothing
    to pre-fill from"), but is independently testable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T003 and T004 (Foundational) run in parallel.
- T006 (US1 test) can be drafted in parallel with T007–T008 (implementation).
- T014 and T015 (Polish) run in parallel with each other.

## Parallel Example: Foundational

```bash
Task: "Implement displayNameSchema, avatarTypeSchema, guestProfileSchema in apps/client/src/lib/entry/guest-profile-schema.ts"
Task: "Implement generateDefaultName() in apps/client/src/lib/entry/default-name.ts"
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

- Total tasks: 16 (T001–T016)
- Per-story breakdown: Setup 2, Foundational 3, US1 3, US2 3, US3 2, Polish 3
- Suggested MVP scope: Phase 3 (User Story 1) only, on top of features 001–003
- All tasks above follow the required `- [ ] [ID] [P?] [Story?] Description with file path`
  format
