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

- **Rationale**: One read and one write keeps persistence atomic and simple, and makes
  fallback trivial — if the blob is missing, malformed JSON, or has an invalid shape (e.g. a
  corrupted `avatarType`), the whole thing is treated as "no stored profile" (satisfying
  FR-008) rather than needing per-field recovery logic.
- **Alternatives considered**: Separate keys per field (rejected — more storage calls, and a
  partially-corrupted state — e.g. valid name but invalid avatar type — becomes possible and
  has to be handled anyway; a single blob with whole-shape validation avoids that case
  entirely).

## Decision: Implement name/avatar-type validation and default-name generation as pure
functions, independent of the `EntryForm` component

- **Rationale**: `isValidName`, `clampName`, `isValidAvatarType`, `fallbackAvatarType`, and
  `generateDefaultName` are all deterministic given their inputs and don't need a DOM or
  Svelte runtime to test — exactly the kind of logic worth unit-testing directly, keeping the
  Svelte component itself thin (just wiring, not business rules).
- **Alternatives considered**: Inlining validation directly inside `entry-form.svelte`
  (rejected — harder to unit test in isolation, and mixes UI wiring with business rules for
  no benefit).
