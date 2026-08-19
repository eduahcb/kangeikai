# Implementation Plan: Realtime Multiplayer Sync

**Branch**: `002-realtime-multiplayer-sync` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-realtime-multiplayer-sync/spec.md`

## Summary

Add a realtime multiplayer room process that holds the authoritative set of currently-
connected participants for the single shared office space, and syncs each participant's
`AvatarState` (from feature 001) to everyone else with low latency, handling join, leave, and
brief-disconnect reconnection. The client (feature 001's scene) is extended to render remote
avatars driven by this sync layer instead of only the local one.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (both server and client)

**Primary Dependencies**: Colyseus (server-side room framework + client SDK), reusing
`AvatarState` from `packages/shared`

**Storage**: N/A — Colyseus room state lives entirely in process memory (per constitution
Principle IV); nothing survives a server restart

**Testing**: `@colyseus/testing` for integration-style tests that simulate multiple clients
joining/leaving/syncing against a real `OfficeRoom` instance without real network sockets;
Vitest for any pure logic extracted from the room handler

**Target Platform**: A single Node.js server process (later deployed to the Hetzner VPS via
Coolify — out of scope for this feature) plus the existing browser client from feature 001

**Project Type**: Web application — adds an `apps/server` package alongside `apps/client`

**Performance Goals**: Perceived cross-client update latency under ~150ms on typical
broadband; correctly handle ≥20 concurrent participants in the one room

**Constraints**: Single room instance only (no horizontal scaling / sticky-session concerns
in the MVP); all state in memory; client remains authoritative for its own position (no
server-side collision re-validation in the MVP — see research.md)

**Scale/Scope**: One shared room process, tens of concurrent participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Locked MVP Scope** — PASS. Syncs exactly position/direction/motion-state/join/leave;
  no chat, no zones, no multi-room.
- **II. Simplest Proximity Architecture First** — N/A directly (this feature doesn't own A/V),
  but its single-room design is what feature 003's single-LiveKit-room proximity approach
  will piggyback on for "who's nearby" distance calculations.
- **III. No Backend-Persisted Identity** — PASS. Participant Session exists only for the
  connection's lifetime; no account, no identity store.
- **IV. No Database in the MVP** — PASS. Colyseus in-memory state only; explicit FR-007
  requires no persistence across restarts.
- **V. Fixed Technology Stack** — PASS. Uses Colyseus exactly as fixed by the constitution;
  no new stack element introduced.
- **VI. Open Source, Self-Hostable, Packaging Deferred** — N/A to this feature's logic; no
  packaging concerns here.

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-realtime-multiplayer-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── office-room-protocol.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── client/                                  # Existing app from feature 001
│   ├── src/
│   │   └── lib/
│   │       ├── network/
│   │       │   └── room-connection.ts        # Connects to the Colyseus server, sends local
│   │       │                                 # AvatarState, exposes remote-state events
│   │       └── game/
│   │           └── scenes/
│   │               └── office-scene.ts       # (modified) spawns/updates/removes remote
│   │                                         # Avatar entities from RoomConnection events
│   └── tests/
│       └── unit/
│           └── room-connection.spec.ts      # Vitest: reconnection/backoff logic in isolation
│
└── server/                                  # New: Colyseus server app
    ├── src/
    │   ├── rooms/
    │   │   ├── office-room.ts                # Room: onJoin/onLeave/onMessage, reconnection
    │   │   │                                 # grace period (FR-008/FR-009)
    │   │   └── schema/
    │   │       └── avatar-schema.ts          # Colyseus Schema mirroring shared AvatarState
    │   └── index.ts                         # Server entrypoint: colyseus.js app + HTTP server
    └── tests/
        └── integration/
            └── office-room.spec.ts          # @colyseus/testing: join/leave/sync/reconnect
                                              # scenarios (US1–US3)

packages/
└── shared/
    └── src/
        └── avatar.ts                        # Reused unchanged from feature 001
```

**Structure Decision**: Adds a new `apps/server` package (Colyseus) to the existing monorepo
from feature 001, plus a `RoomConnection` module in `apps/client` that bridges the network
layer into the existing `OfficeScene`. `packages/shared`'s `AvatarState` is reused as-is so
client and server never define the shape twice.

## Complexity Tracking

*No violations — table omitted.*
