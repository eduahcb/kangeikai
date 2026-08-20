# Quickstart: Map, Avatar & Movement

## Prerequisites

- `apps/client` SvelteKit dev server runnable locally (`pnpm --filter client dev`, once the
  monorepo scaffold exists).
- Map assets present at `apps/client/src/lib/assets/maps/welcome/welcome.tmj` plus its four
  embedded-tileset source images (`Room_Builder_32x32.png`, `Interiors_32x32.png`,
  `Modern_Office_32x32.png`, `Room_Builder_Office_32x32.png`), and avatar sprites at
  `apps/client/src/lib/assets/sprites/avatar-{man,woman}-{idle,walk}.png`.

## Validation Scenarios

1. **Load and see the map + avatar**
   - Run the dev server and open the game page in a browser.
   - Expected: the office map renders, the local avatar renders on it at a valid spawn
     point (not inside an obstacle).

2. **Move in all four directions (Story 1, FR-003)**
   - Press each of up/down/left/right in turn.
   - Expected: the avatar moves continuously in the held direction; stops when the key is
     released (spec.md Acceptance Scenario 1/3).

3. **Collide with an obstacle (Story 1, FR-004, SC-003)**
   - Walk the avatar into every obstacle area defined on the map.
   - Expected: the avatar stops at the obstacle boundary in every case; it never overlaps
     or passes through.

4. **Direction + animation feedback (Story 2, FR-005)**
   - Move in each direction, then stop.
   - Expected: sprite faces the direction of travel and animates while walking; returns to
     an idle pose facing the last direction when stopped.

5. **Opposing keys (Edge Case, FR-008)**
   - Hold left and right simultaneously, then release one.
   - Expected: no jitter; movement resolves to a single consistent direction.

6. **Focus loss while moving (Edge Case, FR-009)**
   - Start moving, then switch to another browser tab/application without releasing the
     key.
   - Expected: the avatar stops moving; it does not keep walking indefinitely.

7. **Camera follow on a map larger than the viewport (Story 3, FR-006, SC-004)**
   - Walk from the center toward each edge of the map.
   - Expected: viewport scrolls to keep the avatar visible; scrolling stops exactly at the
     map's outer boundary, never revealing area outside the map.

8. **Resize while near an edge (Edge Case)**
   - Position the avatar near a map edge, then resize the browser window.
   - Expected: viewport recomputes so the avatar remains visible.
