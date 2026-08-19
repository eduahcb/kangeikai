# Phase 0 Research: Guest Entry Flow

## Decision: Generate the default display name from a small inline adjective+noun+number
wordlist, with no new dependency

- **Rationale**: The default name (FR-006) only needs to feel friendly and be non-blank; a
  small hardcoded wordlist combined client-side is trivial to implement and test, and adding
  a dependency for this would be disproportionate (constitution Principle V discourages
  unnecessary stack additions).
- **Alternatives considered**: A name-generator npm package (rejected — unjustified
  dependency for a few lines of logic); a purely numeric default like `"Guest-482"` (rejected
  as a fallback only — a wordlist-based name reads as friendlier, which is the whole point of
  Story 3).

## Decision: Wrap every `localStorage` read/write in `try/catch` and treat any failure the
same as "no stored profile"

- **Rationale**: Some browsers (notably Safari in certain private-browsing configurations)
  throw on `localStorage.setItem` rather than silently no-opping, and storage can also simply
  be disabled by browser settings/policy. Catching broadly and falling back to "first-time
  visitor" behavior satisfies FR-007 without needing to special-case each failure mode.
- **Alternatives considered**: Feature-detecting storage availability up front (e.g. a
  test-write-then-delete probe) (rejected — `try/catch` around the real read/write calls
  covers the same failures with less code and no extra I/O).

## Decision: Store the `GuestProfile` as a single JSON blob under one `localStorage` key,
not as separate keys per field

- **Rationale**: One read and one write keeps persistence atomic and simple. Per-field
  recovery (keep a valid `displayName` even if `avatarType` is corrupted, per FR-008) is
  still possible with a single blob — it's handled by the Valibot schema's per-field
  `fallback()` behavior (see the next decision), not by splitting storage into multiple keys.
- **Alternatives considered**: Separate keys per field (rejected — more storage calls for no
  benefit once per-field fallback is handled at the schema level instead).

## Decision: Validate and parse `GuestProfile` with a Valibot schema, using per-field
`v.fallback()` for stored-data loading and the same field schemas (without fallback) for
form-submission validation

- **Rationale**: Per constitution Principle V, Valibot is the project's one validation/schema
  library. A single `guestProfileSchema` built from two field-level schemas
  (`displayNameSchema`, `avatarTypeSchema`) serves both contexts this feature needs, which
  have different strictness requirements:
  - **Loading a stored profile** (`GuestProfileStore.load()`) must be lenient — a corrupted
    `avatarType` shouldn't discard an otherwise-valid stored `displayName` (FR-008 asks for
    exactly this: fall back the invalid field, keep the rest). Wrapping each field with
    `v.fallback(schema, defaultValue)` gives that per-field recovery for free, while a
    structurally invalid blob (not even an object, e.g. `null` or an array) still fails
    `v.safeParse()` entirely and is treated as "no stored profile" (Story 3's default-name
    path) — there's nothing per-field to fall back to.
  - **Form submission** (`entry-form.svelte`'s confirm handler) must be strict — an empty
    name actively blocks entry (FR-002), it doesn't silently become a generated default. This
    reuses `displayNameSchema`/`avatarTypeSchema` directly (no `fallback()` wrapper), so a
    `v.safeParse()` failure surfaces as a validation error the form displays.
  This also resolves an internal tension in an earlier draft of this feature (whole-blob
  "any invalid field discards the whole profile" vs. FR-008's literal per-field fallback
  requirement) — Valibot's `fallback()` primitive is a direct fit for what FR-008 actually
  asks for.
- **Alternatives considered**: Hand-rolled pure validation functions per field (rejected —
  reinvents what Valibot already does, and the project has already fixed Valibot as its one
  validation library rather than picking ad hoc per feature); one schema without per-field
  fallback, treating any invalid field as "discard the whole stored profile" (rejected —
  doesn't satisfy FR-008's explicit per-field fallback wording).

## Decision: Keep `generateDefaultName()` as a plain function, independent of the schema

- **Rationale**: Generating a friendly default name (Story 3) is unrelated to validation — it
  produces a value, it doesn't check one. It's used in two places: as the `v.fallback()`
  default for `displayName` when loading a corrupted/absent stored profile, and directly by
  `entry-form.svelte` to pre-fill the name field when `GuestProfileStore.load()` returns
  nothing at all. Keeping it a small, dependency-free pure function (per the earlier wordlist
  decision above) keeps it trivially unit-testable on its own.
- **Alternatives considered**: Folding default-name generation into the Valibot schema itself
  (rejected — conflates "what's a valid value" with "what's a good default value to suggest,"
  which are different concerns with different reasons to change).
