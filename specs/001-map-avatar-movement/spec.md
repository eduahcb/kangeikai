# Feature Specification: Map, Avatar & Movement

**Feature Branch**: `001-map-avatar-movement`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Render the shared virtual office map and let each connected person move a 2D avatar around it in real time, blocked by the map's walls/obstacles, as the foundational visual layer of the Kangeikai MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move freely around the space (Priority: P1)

A person opens the virtual office and sees the shared map along with their own avatar. Using
the keyboard, they walk their avatar around the open floor, exploring the space.

**Why this priority**: This is the foundational mechanic. Without it there is no "virtual
office" experience — everything else (presence, proximity chat) depends on the avatar being
able to occupy and move through a shared space.

**Independent Test**: Load the space alone (no other participants required), confirm the map
renders, confirm the avatar renders on it, confirm keyboard input moves the avatar smoothly
across the walkable area.

**Acceptance Scenarios**:

1. **Given** the space has finished loading, **When** the user presses a directional key
   (up/down/left/right), **Then** the avatar moves continuously in that direction until the key
   is released.
2. **Given** the avatar is moving toward a wall or obstacle defined by the map, **When** it
   reaches that boundary, **Then** the avatar stops at the boundary and does not pass through it.
   [DEFERRED past MVP — see FR-004 and Assumptions: the avatar currently moves freely through
   every obstacle; this scenario isn't satisfied until a future wave]
3. **Given** no key is being pressed, **When** the user takes no action, **Then** the avatar
   remains stationary in place.

---

### User Story 2 - See the avatar reflect direction and motion (Priority: P2)

While moving, the person's avatar visually faces the direction of travel and shows a walking
motion; when stationary it shows an idle pose.

**Why this priority**: Readable movement feedback is what makes the space feel alive and lets
other participants (once multiplayer sync is added) understand what a person is doing. It is
secondary to raw movement working at all.

**Independent Test**: Move the avatar in each of the four directions and confirm it visually
faces that direction; release all keys and confirm it switches to an idle pose within a moment.

**Acceptance Scenarios**:

1. **Given** the avatar is idle, **When** the user starts moving up/down/left/right, **Then**
   the avatar's sprite faces that direction and plays a walking animation.
2. **Given** the avatar is walking, **When** the user releases all movement keys, **Then** the
   avatar returns to an idle pose facing the last direction of travel.

---

### User Story 3 - Keep the avatar in view on a larger map (Priority: P3)

The map is larger than the visible screen. As the person walks toward its edges, the visible
area scrolls so the avatar stays visible and centered where possible.

**Why this priority**: Nice-to-have polish for spatial orientation; the core loop (Story 1)
works even if the entire map happens to fit on screen, but a realistic office floor plan will
likely exceed typical viewport sizes.

**Independent Test**: Walk the avatar from the center of the map toward an edge and confirm the
visible viewport scrolls to follow it, stopping appropriately at the map's outer boundary.

**Acceptance Scenarios**:

1. **Given** the avatar is near the center of the map, **When** the user moves it toward an
   edge, **Then** the viewport scrolls to keep the avatar visible.
2. **Given** the avatar has reached the outer boundary of the map, **When** the user continues
   moving toward that edge, **Then** the viewport stops scrolling at the map's edge (it never
   shows area outside the map).

---

### Edge Cases

- What happens when the browser window is resized while the avatar is near a map edge? The
  viewport MUST recompute so the avatar stays visible.
- What happens if the user holds two opposing directional keys at once (e.g., left and right)?
  The system MUST resolve this to a single consistent direction (no jitter) rather than
  canceling out unpredictably.
- What happens if the browser tab loses focus while a movement key is held? The avatar MUST
  stop moving (no "stuck key" causing indefinite movement after focus is lost).
- What happens if the avatar's starting position happens to be on/inside an obstacle due to a
  map authoring mistake? Out of scope for this feature — treated as a map-authoring defect, not
  a runtime behavior to design around.
- What happens when the avatar moves toward the map's outer edge (as distinct from an interior
  obstacle — FR-004's collision is deferred past the MVP, see Assumptions, but this is not)? The
  avatar MUST stop at the map's outer boundary, never moving to a position outside the map's
  pixel dimensions. Without this, the avatar can walk to a position the camera (clamped to the
  map's bounds, FR-006) can never scroll to, making it disappear with no way back — found live
  during Phase 6 testing, fixed by clamping `Avatar.x`/`y` to `[0, mapWidthPx]`/`[0, mapHeightPx]`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a single, fixed, shared map as the virtual office floor.
- **FR-002**: System MUST render the local user as a 2D avatar positioned on the map.
- **FR-003**: Users MUST be able to move their avatar in at least four directions (up, down,
  left, right) using keyboard input.
- **FR-004** *(deferred past MVP — see Assumptions)*: System MUST prevent the avatar from moving
  through areas of the map marked as walls/obstacles.
- **FR-005**: System MUST visually reflect the avatar's current facing direction and motion
  state (idle vs. walking).
- **FR-006**: System MUST keep the avatar within the visible viewport as it moves around a map
  that may exceed the screen size (camera follow), without ever revealing area outside the
  map's bounds.
- **FR-007**: Avatar appearance MUST be limited to exactly two selectable visual types (the
  selection mechanism itself is out of scope for this feature; see the guest entry flow
  feature).
- **FR-008**: System MUST resolve simultaneous opposing directional input into a single,
  consistent movement state rather than undefined/jittery behavior.
- **FR-009**: System MUST stop avatar movement when the browser tab/window loses input focus.
- **FR-010**: System MUST parse named, tagged zones (`personal-desk`, `public-space`) from the
  map's Tiled object layer and expose them as data (name, tag, boundary) for other features to
  consume — this feature does not itself use zones for anything beyond parsing/exposing them.

### Key Entities

- **Avatar**: The local user's visual presence on the map. Attributes: position (x, y),
  facing direction, movement state (idle/walking), visual type (one of exactly two).
- **Map**: The single shared virtual office space. Defines the walkable area and the
  walls/obstacles that block movement, and is authored ahead of time as a fixed asset (no
  in-product map editor).
- **Zone**: A named, tagged region of the map authored as a Tiled object-layer object (e.g.
  `name: desk-01`, `tag: personal-desk`; `name: public-space-01`, `tag: public-space`). Zones
  do not block movement — they mark areas whose membership (which avatars are currently inside)
  is used by the proximity voice/video feature to determine conversation activation. No private
  zones exist in the MVP; only `personal-desk` and `public-space` tagged zones are authored.
  See feature 003 for how zone membership drives voice/video.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** *(deferred past MVP — see Assumptions)*: A user can traverse the entire walkable
  area of the map from any starting point without the avatar passing through a defined obstacle
  or getting visually stuck outside the intended boundaries.
- **SC-002**: On-screen avatar movement visibly responds to a keypress with no perceptible
  input lag for the local player.
- **SC-003** *(deferred past MVP — see Assumptions)*: 100% of obstacle areas defined in the map
  data correctly block avatar movement when tested by walking into every obstacle on the map.
- **SC-004**: The avatar remains visible within the viewport at all times while moving across
  the full extent of the map.

## Assumptions

- Only one shared map/room exists for the MVP (per project constitution) — no map switching,
  multiple floors, or in-product map editing.
- Exactly two avatar visual types exist; this feature only renders whichever type was already
  chosen — the choice itself is made in the guest entry flow feature.
- Desktop keyboard input is the primary interaction method for the MVP; touch/mobile controls
  and gamepad support are out of scope.
- The map is authored ahead of time as a fixed, versioned asset shipped with the application.
- This feature covers only the local user's avatar rendering/movement; synchronizing multiple
  people's avatars in real time is covered by a separate realtime multiplayer sync feature.
- **Obstacle collision (FR-004, SC-001, SC-003, Story 1 Acceptance Scenario 2) is explicitly
  deferred past the MVP**, by product decision recorded in `docs/mvp-plan.md`'s "Fora do MVP"
  list. The MVP ships with the avatar moving freely through every obstacle on the map; blocking
  movement at walls/furniture lands in a later wave, once the map also has a collision layer
  authored in Tiled (it doesn't yet — see `data-model.md`'s `MapDefinition.collisionLayer`).
