# Contract: OfficeRoom Network Protocol

The single shared room's client↔server contract. Server is implemented with Colyseus; client
uses the Colyseus client SDK. Both sides depend on the `AvatarState` shape defined in
`specs/001-map-avatar-movement/contracts/avatar-state.md`.

## Join

Client connects to the one well-known room (`office`) with join options:

```ts
interface OfficeJoinOptions {
  spriteType: "man" | "woman"; // chosen by the guest entry flow feature (004) before this call
  accessCode: string;          // typed on the entry form; see OfficeRoom.onAuth below
}
```

The server validates `options` against a Valibot schema (`officeJoinOptionsSchema` in
`message-schemas.ts`) before trusting it — join options are untrusted client input over a
network boundary, per constitution Principle V. A validation failure rejects the join.

Before that, `OfficeRoom.onAuth` checks `accessCode` against the server's `ACCESS_CODE`
environment variable — a simple shared-secret room lock, not per-user auth. Only enforced when
`ACCESS_CODE` is actually set (local dev needs no code configured); when set, a mismatch
rejects the connection before any session/avatar exists, which also transitively blocks
proximity audio/video (spec 003), since that depends on a real `onJoin` having happened
(`session-proof.ts`).

The server assigns a `sessionId` and adds a `ParticipantSession` to `OfficeRoomState.players`,
seeding `avatarState` with the given `spriteType` and a valid spawn position (feature 001's
`MapDefinition` invariant: spawn must be outside the collision layer).

The server also sends a one-off `"sessionProof"` message (`{ proof: string }`, an HMAC of
`sessionId` — see `apps/server/src/session-proof.ts`), which the client MUST include as
`proof` when requesting a LiveKit token (spec 003's `contracts/livekit-token-endpoint.md`) —
this is how that endpoint confirms a token request's `identity` came from a real session
rather than an unauthenticated caller (security review finding, spec 003). Best-effort: a
missing `SESSION_SIGNING_SECRET` server-side skips sending it rather than failing the join,
so proximity audio/video degrades gracefully instead of blocking movement/presence (FR-009).

## Server → Client: State Sync

The server exposes `OfficeRoomState` (see `data-model.md`) as a Colyseus `Schema`. The client
SDK automatically receives delta patches whenever any `players` entry changes — this is the
sole mechanism for FR-001–FR-004 (position/direction/motion-state sync, join/leave visibility).
No separate "player moved" message type is needed.

## Client → Server: Position Updates

Client sends a throttled message (see research.md: on-change, capped ~20/sec) with its own
new state:

```ts
// message type: "updateState"
interface UpdateStatePayload {
  x: number;
  y: number;
  direction: AvatarDirection;
  motionState: AvatarMotionState;
}
```

The server validates this payload against a Valibot schema (`updateStatePayloadSchema` in
`message-schemas.ts` — `x`/`y` numeric, `direction`/`motionState` restricted to their known
values) before using it; a failure is dropped rather than applied. Validated fields are
written directly into the sender's own `ParticipantSession.avatarState` fields (`spriteType`
is immutable post-join and never included here) and Colyseus's Schema sync propagates them.
Validation here is a shape/type check only — the server does not re-validate collision
against the map (see research.md "client-authoritative" decision); a well-formed but
physically-impossible position is still accepted, out of scope for the MVP.

## Reconnection

On an ungraceful disconnect, the server calls Colyseus's `allowReconnection` with a bounded
grace period and removes the session from the broadcast `players` map for that window
(data-model.md state transition). The client SDK's reconnection call resumes the same
`sessionId`/`avatarState` if it succeeds within the window; otherwise the server finalizes the
session's removal (FR-009), which is indistinguishable to other clients from a clean leave.

## Stability

Changing `UpdateStatePayload` or the join options requires updating both `apps/client`'s
`room-connection.ts` and `apps/server`'s `office-room.ts` together — this is the feature's core
cross-process contract.
