# Phase 1 Data Model: Guest Entry Flow

## GuestProfile

The client-only identity chosen at entry, persisted (best-effort) in `localStorage`.

| Field | Type | Notes |
|---|---|---|
| `displayName` | string | Trimmed, non-empty, length ≤ `MAX_NAME_LENGTH` (FR-002, FR-003) |
| `avatarType` | `AvatarSpriteType` (`"man" \| "woman"`, from `packages/shared/src/avatar.ts`, feature 001) | Falls back to a default valid value if the stored value is missing/invalid (FR-008) |

**Validation rules** (enforced via a Valibot schema, `apps/client/src/lib/entry/guest-profile-schema.ts`
— see research.md):
- `displayName` MUST NOT be empty or whitespace-only (FR-002) and MUST be ≤ `MAX_NAME_LENGTH`
  characters (FR-003). On **form submission**, a failure blocks entry (`displayNameSchema`,
  strict). On **loading a stored value**, a failure falls back to a freshly generated default
  name via `v.fallback()` rather than blocking anything (Story 3's default-name behavior).
- `avatarType` MUST be one of the two defined values (`avatarTypeSchema`, a Valibot
  `picklist`). On form submission, an invalid value is a validation error. On loading a
  stored value, an invalid value falls back to a default valid value (FR-008) via
  `v.fallback()` — the person is not blocked from entering, they just see the fallback
  selected, and a separately-valid stored `displayName` is preserved.
- A stored blob that isn't even a valid object shape (missing entirely, malformed JSON, or
  not an object at all) fails Valibot's `v.safeParse()` outright — there's no per-field value
  to fall back to, so this is treated as "no stored profile" (Story 3's default-name path,
  Edge Case's graceful `localStorage`-unavailable behavior).

**Storage**:
- Persisted as a single JSON blob under one `localStorage` key (research.md decision).

**Lifecycle**:
- Created/overwritten only on successful entry confirmation (FR-004); never partially
  written.
- Never transmitted to or stored by any server — this feature's persistence is entirely
  local to the browser (constitution Principle III).
