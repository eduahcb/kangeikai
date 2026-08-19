# Phase 1 Data Model: Map, Avatar & Movement

## AvatarState

Represents a single avatar's renderable state. Owned by this feature for the local player;
reused as the wire-format basis by `002-realtime-multiplayer-sync` for remote players.

| Field | Type | Notes |
|---|---|---|
| `x` | number | Position on the map, in map pixel coordinates |
| `y` | number | Position on the map, in map pixel coordinates |
| `direction` | `"up" \| "down" \| "left" \| "right"` | Last-known facing direction |
| `motionState` | `"idle" \| "walking"` | Drives which animation plays |
| `spriteType` | `"man" \| "woman"` | Exactly two values, per constitution Principle I; set at
  join time by the guest entry flow feature, immutable for the session |

**Validation rules**:
- `spriteType` MUST be one of the two defined values; no other value is valid.
- `x`/`y` MUST remain within the map's pixel bounds at all times (enforced by obstacle/edge
  collision, not by clamping after the fact).

**State transitions**:
- `idle → walking`: on directional key press with no opposing key held.
- `walking → idle`: on release of all directional keys, or on focus loss (Edge Case: tab
  loses focus while a key is held).
- `direction` updates immediately on a new directional key press, independent of
  `motionState`.

## MapDefinition

Represents the single fixed office map, authored in Tiled.

| Field | Type | Notes |
|---|---|---|
| `widthPx` / `heightPx` | number | Full map dimensions, used for camera bounds (FR-006) |
| `walkableLayer` | tile layer | Visual floor/background |
| `collisionLayer` | object/tile layer | Marks obstacle areas that block avatar movement
  (FR-004) |

**Validation rules**:
- Exactly one `MapDefinition` exists for the MVP (per constitution — no map switching).
- The avatar's spawn position MUST fall within `walkableLayer` and outside
  `collisionLayer` (a map-authoring invariant, not something the runtime corrects for —
  see spec.md Edge Cases).
