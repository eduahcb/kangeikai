# Phase 0 Research: Realtime Multiplayer Sync

## Decision: Client-authoritative position; server relays and broadcasts without re-validating
collision

- **Rationale**: The virtual office is a trusted, non-competitive, small-scale OSS space, not
  a game where cheating matters. Re-validating collision server-side duplicates feature 001's
  obstacle logic and adds real complexity (keeping two collision implementations in sync) for
  no MVP-stage benefit. The client already enforces obstacles locally (feature 001, FR-004);
  the server's job here is purely to relay state, matching constitution Principle I (locked,
  minimal scope).
- **Alternatives considered**: Server-authoritative movement with server-side collision
  checks (rejected — meaningfully more implementation effort, and anti-cheat has no payoff
  for this product's threat model at MVP stage; revisit only if abuse becomes an observed
  problem).

## Decision: Use Colyseus's built-in Schema state sync (not hand-rolled message broadcasting)

- **Rationale**: Colyseus's `Schema`/`MapSchema` gives automatic, delta-based state
  synchronization to all connected clients — exactly what FR-001/FR-002/FR-003/FR-004 need —
  without hand-writing a diffing/broadcast protocol. This is literally the tool the
  constitution already fixed the stack to.
- **Alternatives considered**: Custom message-based broadcasting (`room.broadcast()` for every
  movement) (rejected — reimplements what Schema sync already does correctly and efficiently,
  and loses automatic reconnection state resync).

## Decision: Throttle client → server position updates (send on change, capped at ~20/sec)
rather than every render frame

- **Rationale**: Sending on every render frame (~60/sec) is unnecessary network chatter for
  human-scale walking speed and risks undermining the ~150ms latency budget (SC-001) under
  load with more participants. ~20/sec is well above human perception of "smooth" and leaves
  headroom for FR-006's ≥20 concurrent participants.
- **Alternatives considered**: Sending every frame (rejected — wasteful, doesn't improve
  perceived smoothness meaningfully); sending only on discrete "stopped moving" events
  (rejected — would make continuous movement look laggy/steppy to observers).

## Decision: Rely on Colyseus's built-in `allowReconnection` grace-period mechanism for
FR-008/FR-009 rather than custom heartbeat/reconnect code

- **Rationale**: Colyseus already implements exactly this: a disconnected client can attempt
  to reconnect within a configurable grace window and resume its same session/state; if the
  window elapses without reconnection, the server treats it as a genuine leave. This maps
  directly onto Story 3 and Edge Case ("connection drop that lasts too long"), with no custom
  protocol needed.
- **Alternatives considered**: Custom client-side heartbeat + manual session re-attachment
  (rejected — reimplements a solved problem the chosen framework already handles).

## Decision: Test the room's join/leave/sync/reconnect behavior with `@colyseus/testing`
against an in-memory room instance, not real WebSocket connections

- **Rationale**: `@colyseus/testing` is the framework-provided way to simulate multiple
  clients against a real `Room` implementation without opening actual sockets — faster and
  more deterministic than spinning a real server + WebSocket clients in CI, while still
  exercising the real room logic (not a mock of it).
- **Alternatives considered**: End-to-end tests with real WebSocket clients against a running
  server (rejected for the MVP — higher setup/flakiness cost; revisit if `@colyseus/testing`
  proves insufficient to catch a real class of bugs).
