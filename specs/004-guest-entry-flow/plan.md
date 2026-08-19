# Implementation Plan: Guest Entry Flow

**Branch**: `004-guest-entry-flow` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-guest-entry-flow/spec.md`

## Summary

Add a pre-join entry step to the existing SvelteKit page: a form collecting a display name and
one of the two avatar types, validated client-side, persisted to (and restored from) the
browser's `localStorage`, with graceful fallback when storage is unavailable or its contents
are invalid. On confirm, hands the chosen `displayName`/`avatarType` off to the rest of the
app (features 001–003). Entirely client-only — no server involvement.

## Technical Context

**Language/Version**: TypeScript 5.x on browser (SvelteKit component/route code)

**Primary Dependencies**: None beyond the existing SvelteKit app — `localStorage` is a
built-in browser API; a default display name is generated from a small inline wordlist, not a
new dependency

**Storage**: Browser `localStorage`, scoped to the browser — this is the one MVP feature that
legitimately uses client-side storage (explicitly distinct from the constitution's "no
database" rule, which is about server-side persistence)

**Testing**: Vitest unit tests for the pure validation/default-name logic and for the
`GuestProfileStore` wrapper against a mocked (including throwing/absent) `localStorage`

**Target Platform**: Browser only — no server involvement in this feature at all

**Project Type**: Web application — client-only addition to the existing `apps/client`

**Performance Goals**: Entry flow feels instant — everything is local, no network round-trip
is part of confirming entry

**Constraints**: All `localStorage` access MUST be wrapped so a throwing or absent
implementation (e.g. certain private-browsing modes) degrades to "treat as first-time visitor"
rather than breaking entry (FR-007)

**Scale/Scope**: One form component plus a small storage/validation module; no new app package

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Locked MVP Scope** — PASS. Exactly name + one-of-two-avatar-types entry, nothing more
  (no email, no password, no profile picture upload).
- **II. Simplest Proximity Architecture First** — N/A to this feature.
- **III. No Backend-Persisted Identity** — PASS by construction. This feature *is* the
  concrete implementation of that principle: guest-only, `localStorage`-only, no server call.
- **IV. No Database in the MVP** — PASS. No server-side storage is introduced; `localStorage`
  is explicitly the browser-local exception the constitution and `docs/mvp-plan.md` already
  carve out.
- **V. Fixed Technology Stack** — PASS. Uses only the existing SvelteKit app; no new
  dependency added.
- **VI. Open Source, Self-Hostable, Packaging Deferred** — N/A to this feature.

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-guest-entry-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── guest-profile-handoff.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
└── client/                                    # Existing app from features 001–003
    └── src/
        ├── lib/
        │   └── entry/
        │       ├── constants.ts               # MAX_NAME_LENGTH, storage key, wordlists
        │       ├── validation.ts               # isValidName, clampName, isValidAvatarType,
        │       │                               # fallbackAvatarType (pure functions)
        │       ├── defaultName.ts              # generateDefaultName() (pure function)
        │       ├── GuestProfileStore.ts        # load()/save() wrapping localStorage,
        │       │                               # try/catch fallback (FR-007), uses validation.ts
        │       └── EntryForm.svelte            # Name input + avatar picker + confirm button
        └── routes/
            └── +page.svelte                    # (modified) renders EntryForm first; on
                                                  # confirm, mounts the game (features 001–003)
                                                  # with the chosen displayName/avatarType

    tests/
        └── unit/
            ├── entry-validation.spec.ts        # validation.ts + defaultName.ts
            └── guest-profile-store.spec.ts     # GuestProfileStore against mocked storage
```

**Structure Decision**: Purely additive to the existing `apps/client` app from feature 001; no
new package, no server involvement. Reuses `AvatarSpriteType` from
`packages/shared/src/avatar.ts` (feature 001) for the avatar-type field so this feature never
redefines that shape.

## Complexity Tracking

*No violations — table omitted.*
