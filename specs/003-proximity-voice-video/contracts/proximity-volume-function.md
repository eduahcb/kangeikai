# Contract: `proximityVolume` Pure Function

The single deterministic, unit-tested piece of this feature's proximity logic.

```ts
/**
 * Linear falloff from 1 (distance 0) to 0 (distance >= HEARING_RANGE_PX).
 */
export function proximityVolume(
  distance: number,
  hearingRangePx: number,
): number;
```

**Contract**:
- `proximityVolume(0, R)` → `1` for any `R > 0`.
- `proximityVolume(d, R)` → `0` for any `d >= R`.
- Monotonically non-increasing as `distance` increases across `[0, R)`.
- Output is always clamped to `[0, 1]`.

**Callers**: `proximity-audio-controller.ts` calls this once per remote participant per local
animation frame, using each remote participant's `ProximityRelationship.distance`
(data-model.md), and applies the result as that participant's LiveKit audio track volume —
**but only when `ProximityRelationship.sharedZone` is `false`**. When `sharedZone` is `true`
(FR-011, data-model.md), the caller skips this function entirely and applies volume `1` directly
— zone membership overrides the distance falloff rather than feeding into it.

**Why a contract for an internal function**: this is the one piece of FR-002/FR-003/SC-002
that is cheaply and meaningfully unit-testable (research.md) — pinning its input/output
contract here keeps the corresponding test in `tests/unit/proximity-volume.spec.ts` meaningful
even as the falloff curve itself is refined later (research.md notes linear-now,
inverse-square-later as a valid swap).
