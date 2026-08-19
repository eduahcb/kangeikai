# Phase 1 Data Model: Realtime Multiplayer Sync

## ParticipantSession

One connected person's presence within the shared room, for the lifetime of their connection
(including any active reconnection grace period).

| Field | Type | Notes |
|---|---|---|
| `sessionId` | string | Framework-assigned unique id for this connection |
| `avatarState` | `AvatarState` (from `packages/shared/src/avatar.ts`, feature 001) | The participant's current position, direction, motion state, and sprite type |
| `connected` | boolean | `false` while inside a reconnection grace period (FR-008), `true` otherwise |

**Validation rules**:
- `avatarState.spriteType` is set once at join time (from the guest entry flow feature's
  join payload) and does not change for the life of the session.
- A `ParticipantSession` is removed entirely when its reconnection grace period elapses
  without the client reconnecting (FR-009) or on a clean leave (FR-004).

**State transitions**:
- `(none) → connected`: on successful join (Story 2, FR-003).
- `connected → connected` (grace period): on ungraceful disconnect, session is retained but
  hidden from other participants' view until reconnection or timeout (FR-005, FR-008).
- `connected (grace) → connected`: on successful reconnection within the grace window
  (Story 3, FR-008).
- `connected (grace) → removed`: on grace period timeout (FR-009), triggers the same visible
  effect as a clean leave (FR-004).

## OfficeRoomState

The single shared room's authoritative state, broadcast (via delta sync) to every connected
client.

| Field | Type | Notes |
|---|---|---|
| `players` | map of `sessionId → ParticipantSession.avatarState` | Exactly one `OfficeRoomState` instance exists for the MVP (one room, per constitution) |

**Validation rules**:
- Every key in `players` corresponds to a currently-`connected` `ParticipantSession`; a
  session in its reconnection grace period is excluded from `players` so other participants
  don't see a frozen/ghost avatar during the grace window.
- `players` is never persisted; it exists only in the room process's memory and is empty
  immediately after a process restart (constitution Principle IV, FR-007).
