# Phase 1 Data Model: Guest Entry Flow

## GuestProfile

The client-only identity chosen at entry, persisted (best-effort) in `localStorage`.

| Field | Type | Notes |
|---|---|---|
| `displayName` | string | Trimmed, non-empty, length ≤ `MAX_NAME_LENGTH` (FR-002, FR-003) |
| `avatarType` | `AvatarSpriteType` (`"man" \| "woman"`, from `packages/shared/src/avatar.ts`, feature 001) | Falls back to a default valid value if the stored value is missing/invalid (FR-008) |

**Validation rules**:
- `displayName` MUST NOT be empty or whitespace-only (FR-002); enforced both on form submit
  and when loading a stored value (a corrupted empty stored name is treated as no stored
  profile, triggering the Story 3 default-name behavior).
- `displayName` MUST be clamped to `MAX_NAME_LENGTH` characters (FR-003).
- `avatarType` MUST be one of the two defined values; any other stored value falls back to a
  default valid value (FR-008) rather than being rejected outright — the person is not
  blocked from entering, they just see the fallback selected.

**Storage**:
- Persisted as a single JSON blob under one `localStorage` key (research.md decision).
- Absence, parse failure, or invalid shape are all treated identically to "no stored
  profile" — the entry form behaves exactly as a first-time visit (Story 3's default name,
  Edge Case's graceful `localStorage`-unavailable behavior).

**Lifecycle**:
- Created/overwritten only on successful entry confirmation (FR-004); never partially
  written.
- Never transmitted to or stored by any server — this feature's persistence is entirely
  local to the browser (constitution Principle III).
