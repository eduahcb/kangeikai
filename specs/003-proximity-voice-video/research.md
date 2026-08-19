# Phase 0 Research: Proximity Voice & Video

## Decision: Use LiveKit's native per-track mute/enabled state as the source of truth for
FR-004/FR-006, instead of re-broadcasting a redundant flag through Colyseus

- **Rationale**: LiveKit already emits `trackMuted`/`trackUnmuted` events and exposes
  `Participant.isMicrophoneEnabled`/`isCameraEnabled` to every other participant in the room
  natively. Duplicating this through the realtime sync layer (feature 002) would create two
  sources of truth that could drift out of sync for no benefit.
- **Alternatives considered**: Sync a `muted` flag on `AvatarState` via Colyseus (rejected —
  redundant with what LiveKit already provides, and couples two independent systems that
  constitution FR-009 explicitly requires to stay independent).

## Decision: LiveKit participant `identity` equals the Colyseus `sessionId` for the same
person

- **Rationale**: Proximity volume requires correlating "this LiveKit participant" with "where
  is their avatar," which lives in feature 002's synced state keyed by `sessionId`. Reusing
  the same id as the LiveKit identity is the simplest possible join key and avoids inventing a
  second identity system, consistent with constitution Principle III (no backend identity
  beyond the connection's lifetime).
- **Alternatives considered**: A separate LiveKit-specific identity minted independently
  (rejected — adds a mapping step with no benefit); using the guest's chosen display name as
  identity (rejected — names aren't guaranteed unique, `sessionId` already is).

## Decision: Video renders as HTML `<video>` elements absolutely positioned over the Phaser
canvas, not as WebGL textures inside Phaser

- **Rationale**: Browsers render `<video>` elements (including from `MediaStreamTrack`s)
  efficiently and natively; piping camera frames into a WebGL texture each frame is
  significantly more implementation effort for no MVP-stage visual benefit. Position is
  recomputed each frame from the corresponding avatar's screen-space coordinates (which
  Phaser's camera already exposes).
- **Alternatives considered**: Rendering video as a WebGL texture on a Phaser sprite (rejected
  — real complexity increase, no functional requirement demands it); a fixed sidebar of video
  tiles unrelated to avatar position (rejected — breaks the "who's near me" spatial metaphor
  that's the whole point of proximity chat).

## Decision: Linear volume falloff from full volume at distance 0 to zero volume at the
hearing-range threshold, recomputed every local animation frame

- **Rationale**: The simplest function that satisfies SC-002 ("smooth, no jarring cutoff").
  It's a pure, local computation using positions already available from feature 002 — no
  extra network round-trip, and the hearing-range threshold is a single tunable constant
  (per spec.md Assumptions, not user-configurable in the MVP).
- **Alternatives considered**: Inverse-square falloff (more physically realistic, left as a
  drop-in future refinement since the function is isolated and unit-tested — swapping it
  later doesn't touch any other part of the system); step-function cutoff at the threshold
  (rejected — explicitly what SC-002 says not to do).

## Decision: One HTTP route on the existing `apps/server` process mints LiveKit access
tokens, rather than a separate token service

- **Rationale**: `apps/server` already runs an HTTP server (for Colyseus). Adding one route
  using `livekit-server-sdk` is simpler than standing up a second backend process, and stays
  within the constitution's fixed, minimal stack.
- **Alternatives considered**: A separate microservice for token issuance (rejected —
  unjustified operational overhead for a single stateless endpoint); minting tokens directly
  in the browser (rejected — would require shipping the LiveKit API secret to the client,
  a real security defect).

## Decision: Run LiveKit locally for development via a root-level `docker-compose.livekit.yml`,
with fixed dev API key/secret; do not containerize `apps/server`/`apps/client`

- **Rationale**: LiveKit self-hosted is the one piece of this feature's stack impractical to
  run natively (it's a Go binary with its own config format), so Docker Compose is the
  pragmatic way to make local development self-sufficient without every contributor
  installing/configuring it by hand. `apps/server` and `apps/client` stay as native `pnpm dev`
  processes since containerizing them would slow down hot-reload for no benefit — Docker is
  reserved for the one dependency that actually needs it. This is a developer-experience
  decision, distinct from constitution Principle VI's deferred *production* self-hosting
  package for third parties.
- **Alternatives considered**: Requiring each contributor to install/run `livekit-server`
  manually (rejected — exactly the friction constitution's new local-dev requirement exists to
  remove); containerizing the whole stack including `apps/server`/`apps/client` (rejected per
  the constitution's explicit LiveKit-only scope for local dev Docker usage — see Technology &
  Infrastructure Constraints).

## Decision: Do not attempt automated tests of real WebRTC audio/video; unit-test only the
pure `proximityVolume` function

- **Rationale**: WebRTC media requires real devices/browser engines and is notoriously
  flaky/hardware-dependent in CI. The valuable, deterministic logic — distance-to-volume — is
  cleanly isolated as a pure function and is exactly what's worth locking down with a test;
  everything requiring an actual mic/camera/LiveKit connection is validated manually via
  `quickstart.md`.
- **Alternatives considered**: End-to-end WebRTC tests with headless browsers and fake media
  devices (rejected for the MVP — substantial setup cost for a slice of the product that's
  fundamentally hard to assert on automatically; revisit only if manual QA proves
  insufficient).
