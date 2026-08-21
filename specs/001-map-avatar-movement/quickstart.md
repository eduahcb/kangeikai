# Quickstart: Map, Avatar & Movement

## Prerequisites

- `apps/client` SvelteKit dev server runnable locally (`pnpm --filter client dev`, once the
  monorepo scaffold exists).
- Map assets present at `apps/client/src/lib/assets/maps/welcome/welcome.tmj` plus its four
  embedded-tileset source images (`Room_Builder_32x32.png`, `Interiors_32x32.png`,
  `Modern_Office_32x32.png`, `Room_Builder_Office_32x32.png`), and avatar sprites at
  `apps/client/src/lib/assets/sprites/avatar-{man,woman}-{idle,walk}.png`.

## Validation Scenarios

Results as of Phase 6 (T027), run against the state after Phases 3-5:

1. **Load and see the map + avatar** — ✅ **PASS** (confirmed repeatedly through Phases 3-5's
   browser testing)
   - Run the dev server and open the game page in a browser.
   - Expected: the office map renders, the local avatar renders on it at a valid spawn
     point (not inside an obstacle).

2. **Move in all four directions (Story 1, FR-003)** — ✅ **PASS** (confirmed in Phase 3)
   - Press each of up/down/left/right in turn.
   - Expected: the avatar moves continuously in the held direction; stops when the key is
     released (spec.md Acceptance Scenario 1/3).

3. **Collide with an obstacle (Story 1, FR-004, SC-003)** — **deferred past the MVP**, see
   spec.md's Assumptions. Skip this scenario for now; the avatar currently passes through every
   obstacle by design.
   - ~~Walk the avatar into every obstacle area defined on the map.~~
   - ~~Expected: the avatar stops at the obstacle boundary in every case; it never overlaps
     or passes through.~~

4. **Direction + animation feedback (Story 2, FR-005)** — ✅ **PASS** (confirmed in Phase 4 —
   all four directions face correctly, walk/idle animate; a "less lively" left/right feel was
   investigated and traced to the source art, not a bug)
   - Move in each direction, then stop.
   - Expected: sprite faces the direction of travel and animates while walking; returns to
     an idle pose facing the last direction when stopped.

5. **Opposing keys (Edge Case, FR-008)** — ✅ **PASS** (automated: `T016`'s unit test exercises
   this exact `MovementController` logic; `OfficeScene` wires keydown/keyup to it with no
   additional logic in between, so the unit-tested behavior is what actually runs)
   - Hold left and right simultaneously, then release one.
   - Expected: no jitter; movement resolves to a single consistent direction.

6. **Focus loss while moving (Edge Case, FR-009)** — ✅ **PASS** (automated: `T017`'s unit test
   covers `MovementController.clear()`; `OfficeScene` calls it directly from the
   `Phaser.Core.Events.BLUR` handler, no additional logic in between)
   - Start moving, then switch to another browser tab/application without releasing the
     key.
   - Expected: the avatar stops moving; it does not keep walking indefinitely.

7. **Camera follow on a map larger than the viewport (Story 3, FR-006, SC-004)** — ⚠️
   **PARTIALLY VERIFIED**. The current test map (1536x1024px) is smaller than most screens, so
   the "map bigger than viewport, scrolls and clamps at the edge" case as originally written
   isn't exercisable without shrinking the browser window below the map's size. What *was*
   confirmed in Phase 5: the map centers correctly on a screen wider than the map (previously a
   bug — biased toward one edge based on avatar position), and `clampedCameraScroll()`'s clamp
   math is the same formula for both cases (see `tasks.md` T025). Re-verify the original
   scrolling scenario once the real (larger) map exists.
   - Walk from the center toward each edge of the map.
   - Expected: viewport scrolls to keep the avatar visible; scrolling stops exactly at the
     map's outer boundary, never revealing area outside the map.

8. **Resize while near an edge (Edge Case)** — ✅ **PASS** (manually verified in Phase 6, after
   fixing a real bug this check surfaced: the avatar had no outer-map-boundary clamp at all, so
   walking toward an edge could push it to a position outside the map's pixel dimensions — a
   position the camera, clamped to the map bounds, can never scroll to. The avatar would
   disappear with no way back, resize or not. Fixed by clamping `Avatar.x`/`y` to
   `[0, mapWidthPx]`/`[0, mapHeightPx]` every update — see spec.md's Edge Cases and the new
   `avatar.spec.ts` unit test. With that fix, resize-near-an-edge behaves as expected.)
   - Position the avatar near a map edge, then resize the browser window.
   - Expected: viewport recomputes so the avatar remains visible.
