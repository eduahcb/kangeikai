# Implementation Plan: Proximity Voice & Video

**Branch**: `003-proximity-voice-video` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-proximity-voice-video/spec.md`

## Summary

Connect every participant to a single shared LiveKit room, and simulate proximity purely on
the client by continuously computing each remote participant's perceived volume from the
distance between avatars (already available from feature 002's synced state), per constitution
Principle II. Adds self-mute/camera controls, a muted indicator, and graceful degradation when
permission is denied or hardware is absent. Deploying the LiveKit server itself is explicitly
out of scope here (infra/deploy work, deferred per project sequencing) — this feature only
needs it reachable via configuration.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (server route) and browser (client)

**Primary Dependencies**: `livekit-client` (browser SDK) in `apps/client`; `livekit-server-sdk`
(token minting) in `apps/server`; reuses synced `AvatarState` positions from feature 002

**Storage**: N/A — token minting is stateless (signed JWTs); no server-side session store

**Testing**: Vitest unit tests for the pure distance→volume attenuation function; manual
`quickstart.md` validation with real microphones/cameras for everything that requires actual
WebRTC media (not attempted in automated tests — see research.md)

**Target Platform**: Browser client (both send and receive media) + the existing
`apps/server` Node process, which gains one HTTP route for token minting; depends on a
reachable self-hosted LiveKit server (deployment handled separately)

**Project Type**: Web application — extends `apps/client` and `apps/server` from features
001/002; no new app package

**Performance Goals**: Volume recomputation on every local animation frame (cheap pure
function, no network cost) so proximity feels responsive as avatars move; smooth ramp with no
audible pop at the hearing-range boundary (SC-002)

**Constraints**: Exactly one shared LiveKit room for all participants; proximity MUST be
simulated by client-side volume attenuation only — no dynamic subscribe/unsubscribe to peer
tracks based on distance (constitution Principle II, explicitly not up for reconsideration in
this feature)

**Scale/Scope**: Same single shared room as features 001/002; tens of concurrent participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Locked MVP Scope** — PASS. No isolated meeting-room zones, no per-pair private calls —
  exactly the proximity mechanic in `docs/mvp-plan.md`.
- **II. Simplest Proximity Architecture First** — PASS by construction. This feature *is* the
  implementation of that principle: single LiveKit room, client-side volume attenuation, no
  dynamic subscription logic.
- **III. No Backend-Persisted Identity** — PASS. LiveKit `identity` is scoped to the session
  (mirrors the Colyseus `sessionId`, see research.md); nothing is persisted server-side.
- **IV. No Database in the MVP** — PASS. Token minting is stateless; no storage introduced.
- **V. Fixed Technology Stack** — PASS. Uses LiveKit self-hosted exactly as fixed; no new
  stack element.
- **VI. Open Source, Self-Hostable, Packaging Deferred** — Consistent: this feature only
  requires LiveKit connection details via configuration/env vars, it does not attempt to
  solve LiveKit's own self-hosted deployment (that's the known UDP/TURN risk already flagged
  for the deploy phase, out of scope here).

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-proximity-voice-video/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── livekit-token-endpoint.md
│   └── proximity-volume-function.md
└── tasks.md
```

### Source Code (repository root)

```text
docker-compose.livekit.yml                   # Local dev only: runs a LiveKit dev server with
                                               # fixed dev API key/secret (research.md); not
                                               # used for production deploy (out of scope here)

apps/
├── server/                                   # Existing app from feature 002
│   └── src/
│       ├── http/
│       │   └── livekitToken.ts               # POST /livekit-token — mints a scoped LiveKit
│       │                                     # access token (see contracts/livekit-token-endpoint.md)
│       └── index.ts                           # (modified) mounts the token route alongside
│                                              # the existing Colyseus HTTP server
│
└── client/                                   # Existing app from feature 001/002
    └── src/
        └── lib/
            └── av/
                ├── ProximityAudioController.ts  # Joins the LiveKit room using the minted
                │                                 # token; each frame, computes and applies
                │                                 # per-participant volume from avatar distance
                ├── proximityVolume.ts            # Pure function: distance → volume (unit
                │                                 # tested, see contracts/proximity-volume-function.md)
                ├── MediaControls.ts               # Own mic mute/unmute, camera on/off
                └── AvatarVideoOverlay.svelte      # HTML <video> tiles positioned over nearby
                                                    # avatars' screen-space position each frame

    tests/
        └── unit/
            └── proximity-volume.spec.ts          # Vitest: the pure attenuation function
```

**Structure Decision**: No new app package — this feature adds one HTTP route to the existing
`apps/server` and an `av/` module to the existing `apps/client`. Video rendering uses plain
HTML `<video>` overlays layered over the Phaser canvas rather than WebGL textures (see
research.md), kept in a `.svelte` component since SvelteKit already owns the page shell. A
root-level `docker-compose.livekit.yml` makes local development self-sufficient by running a
LiveKit dev server, per the constitution's local development environment requirement.

## Complexity Tracking

*No violations — table omitted.*
