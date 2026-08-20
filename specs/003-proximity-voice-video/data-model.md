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
| `sharedZone` | boolean | `true` when the local and remote avatar's `zoneId` (below) are equal
  and non-null (FR-011) |
| `volume` | number (0–1) | `1` when `sharedZone`; otherwise `proximityVolume(distance)` — see
  `contracts/proximity-volume-function.md` (FR-011/FR-012) |

**Validation rules**:
- `volume` MUST be `1` whenever `sharedZone` is `true`, regardless of `distance` (FR-011).
- `volume` MUST be `0` for any `distance` at or beyond the hearing-range threshold when
  `sharedZone` is `false` (FR-003/FR-012).
- Recomputed every local animation frame for every currently-connected remote participant;
  never written to any shared/synced state (feature 002's `OfficeRoomState` is untouched by
  this feature, per constitution FR-009's independence requirement).

## ZoneMembership (read from feature 001)

Not owned by this feature — read from feature 001's parsed `Zone` data (spec 001 FR-010) and
each avatar's current position, both already available locally per participant.

| Field | Type | Notes |
|---|---|---|
| `zoneId` | string \| null | The `name` (e.g. `desk-01`) of the zone the avatar's position
  currently falls inside, or `null` if outside every zone. An avatar is assumed to occupy at
  most one zone at a time (zones do not overlap, per map authoring). |

Recomputed per avatar per frame from position + feature 001's zone boundary data; feeds
`ProximityRelationship.sharedZone` above.

## Media State (externally owned)

Not a data structure this feature defines — it is read directly from LiveKit's own
`Participant` object (`isMicrophoneEnabled`, `isCameraEnabled`) for both the local participant
(to drive `media-controls.ts`'s UI) and remote participants (to drive the muted indicator, FR-006,
and whether a video tile is shown, FR-005). Modeling this locally would duplicate state LiveKit
already owns and risk drift (see research.md).
