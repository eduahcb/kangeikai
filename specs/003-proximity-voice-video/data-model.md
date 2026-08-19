# Phase 1 Data Model: Proximity Voice & Video

## ProximityRelationship

An ephemeral, purely local computation — never synced or persisted — representing how loud one
other participant should sound to the local listener right now.

| Field | Type | Notes |
|---|---|---|
| `remoteSessionId` | string | Matches the Colyseus `sessionId` (feature 002) and the LiveKit
  participant `identity` (research.md decision) |
| `distance` | number | Distance between the local and remote avatar, computed from
  `AvatarState.x`/`y` (feature 001/002) |
| `volume` | number (0–1) | Output of `proximityVolume(distance)` — see
  `contracts/proximity-volume-function.md` |

**Validation rules**:
- `volume` MUST be `0` for any `distance` at or beyond the hearing-range threshold (FR-003).
- Recomputed every local animation frame for every currently-connected remote participant;
  never written to any shared/synced state (feature 002's `OfficeRoomState` is untouched by
  this feature, per constitution FR-009's independence requirement).

## Media State (externally owned)

Not a data structure this feature defines — it is read directly from LiveKit's own
`Participant` object (`isMicrophoneEnabled`, `isCameraEnabled`) for both the local participant
(to drive `media-controls.ts`'s UI) and remote participants (to drive the muted indicator, FR-006,
and whether a video tile is shown, FR-005). Modeling this locally would duplicate state LiveKit
already owns and risk drift (see research.md).
