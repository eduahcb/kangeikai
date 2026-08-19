# Feature Specification: Realtime Multiplayer Sync

**Feature Branch**: `002-realtime-multiplayer-sync`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Synchronize every connected person's avatar position, direction
and motion state in real time within the single shared office space, so everyone sees everyone
else move, join, and leave live — the multiplayer backbone of the Kangeikai MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See other people move in real time (Priority: P1)

Two or more people are connected to the shared office space at once. When one of them moves
their avatar, the others see that avatar move on their own screen almost immediately.

**Why this priority**: This is what turns "a map I can walk on" (feature 001) into an actual
multiplayer virtual office. Without it, the product has no shared presence at all.

**Independent Test**: Connect two clients to the shared space, move the avatar on one, and
confirm the movement appears on the other within a near-real-time delay.

**Acceptance Scenarios**:

1. **Given** two people are connected to the shared space, **When** one moves their avatar,
   **Then** the other sees that avatar's position update in near real time.
2. **Given** a person's avatar changes facing direction or switches between idle/walking,
   **When** observed by another connected person, **Then** that visual state is reflected on
   the observer's screen too.

---

### User Story 2 - Know who's currently present (Priority: P2)

People see other participants' avatars appear the moment they join the shared space, and
disappear the moment they leave.

**Why this priority**: Presence awareness — knowing who's actually "in the office" right now —
is a core value of a virtual office, but it builds on Story 1's movement sync already existing.

**Independent Test**: With one client already connected, connect a second client and confirm
its avatar appears for the first; disconnect the second and confirm its avatar disappears for
the first.

**Acceptance Scenarios**:

1. **Given** person A is already connected, **When** person B joins the shared space, **Then**
   B's avatar appears on A's screen using B's chosen avatar type.
2. **Given** person A and B are both connected, **When** B disconnects or leaves, **Then** B's
   avatar disappears from A's screen.

---

### User Story 3 - Recover from a brief connection drop (Priority: P3)

A person's network connection blips momentarily (e.g. a wifi hiccup) and recovers a few seconds
later. They resume participating in the shared space without needing to manually reload.

**Why this priority**: Resilience polish. The core loop (Stories 1–2) is valuable even without
this, but flaky home/office wifi is common enough that graceful recovery meaningfully improves
day-to-day usability.

**Independent Test**: Simulate a brief network interruption on one connected client (e.g.
toggling network off/on) and confirm it resumes syncing with the others afterward without a
manual page reload.

**Acceptance Scenarios**:

1. **Given** a person is connected and participating, **When** their network connection drops
   for a few seconds and then recovers, **Then** their client automatically resumes syncing
   with the shared space without requiring a manual reload.
2. **Given** a person's connection drop is brief, **When** other participants were connected
   throughout, **Then** those participants see the recovering person's avatar resume updating
   without needing to take any action themselves.

---

### Edge Cases

- What happens if a person's browser tab is closed abruptly (crash, force-quit) rather than
  leaving cleanly? Their avatar MUST still disappear for everyone else within a bounded time
  (no permanent "ghost" avatar).
- What happens when many avatars move simultaneously? Each avatar's synchronized state MUST
  stay independent — no cross-talk or corruption between participants' updates.
- What happens if two people join at the exact same moment? Both MUST join successfully with
  correct, uncorrupted shared state.
- What happens if the process holding the shared space restarts? All connected people are
  disconnected and must rejoin fresh; no prior state is restored (intentional — see
  Assumptions, consistent with the project's no-database decision).
- What happens if a connection drop (Story 3) lasts too long to reasonably resume? The system
  MUST eventually treat it as a full leave (Story 2 behavior applies) rather than holding the
  slot open indefinitely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST synchronize each connected person's avatar position to all other
  connected people in the shared space.
- **FR-002**: System MUST synchronize each connected person's avatar facing direction and
  motion state (idle/walking) to all other connected people.
- **FR-003**: System MUST show a newly joined person's avatar to everyone already present,
  reflecting that person's already-chosen avatar type.
- **FR-004**: System MUST remove a person's avatar from everyone else's view when that person
  leaves or disconnects.
- **FR-005**: System MUST detect and clean up an ungracefully-closed connection within a
  bounded time, without requiring other participants to take any action.
- **FR-006**: System MUST support at least 20 concurrent participants in the single shared
  space without visibly degraded update responsiveness.
- **FR-007**: System MUST NOT persist participant or avatar state beyond the lifetime of the
  shared space's running process — a restart clears all state.
- **FR-008**: System MUST allow a person whose connection drops briefly to automatically
  resume participating when it recovers, without requiring a manual page reload.
- **FR-009**: System MUST eventually treat a connection that fails to recover within a bounded
  grace period as a full leave (triggering FR-004's behavior for other participants).

### Key Entities

- **Participant Session**: One connected person's presence within the shared space, for the
  lifetime of their connection (including any brief reconnection grace period). Holds their
  current avatar state (position, direction, motion state, avatar type — see feature 001's
  `AvatarState`).
- **Shared Room**: The single live process holding the authoritative set of currently-
  connected Participant Sessions and broadcasting state changes among them. Exactly one
  instance exists for the MVP (no multiple rooms).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Other participants' avatar movements appear to update in near real time —
  perceived delay under roughly 150ms on a typical broadband connection.
- **SC-002**: When a participant joins or leaves, all other currently-connected participants
  see the corresponding avatar appear or disappear within a few seconds at most.
- **SC-003**: The shared space correctly reflects at least 20 concurrent participants moving
  simultaneously without visible desync, missed updates, or state corruption between them.
- **SC-004**: A participant whose connection drops for a few seconds and recovers resumes
  full participation (seeing others, being seen) without any participant needing to manually
  reload, in common transient-network-blip scenarios.
- **SC-005**: No participant's avatar remains visible to others for more than a short, bounded
  time after that participant's connection has genuinely and permanently ended (no lingering
  "ghost" avatars).

## Assumptions

- Exactly one shared room/instance exists for the MVP (per project constitution) — no
  multiple concurrent rooms or room selection.
- No persistence of room or participant state across a process restart is expected or
  desired; a restart intentionally resets everyone (per constitution Principle IV).
- Avatar type/visual is chosen once, before this feature is involved, by the guest entry flow
  feature; this feature only relays and synchronizes it, it does not decide or validate it.
- "Concurrent participants" scale target is tens (≥20), not hundreds — consistent with the
  constitution's decision to defer more scalable proximity/sync architecture to a later phase.
- Voice/video proximity (a separate feature) is not part of this feature's scope; this feature
  only covers avatar position/direction/motion-state and join/leave presence.
