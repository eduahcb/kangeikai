# Quickstart: Realtime Multiplayer Sync

## Prerequisites

- `apps/server` runnable locally (`pnpm --filter server dev`, once scaffolded).
- `apps/client` runnable locally and already able to render the map/avatar (feature 001).
- Two browser windows/profiles (or one normal + one private/incognito) to simulate two
  participants.

## Validation Scenarios

1. **Two participants see each other move (Story 1, SC-001)**
   - Open the client in two browser windows, both joining the shared space.
   - In window A, move the avatar.
   - Expected: window B shows A's avatar move within a near-imperceptible delay.
   - Repeat moving in window B and observe from window A.

2. **Direction/motion-state sync (Story 1, FR-002)**
   - In window A, change direction and start/stop moving.
   - Expected: window B's view of A's avatar reflects the correct facing direction and
     idle/walking animation state.

3. **Join visibility (Story 2, SC-002)**
   - With window A already connected, open window B and join.
   - Expected: B's avatar appears in window A within a few seconds, using B's chosen avatar
     type.

4. **Leave visibility (Story 2, SC-002, SC-005)**
   - With both windows connected, close window B (or navigate away).
   - Expected: B's avatar disappears from window A within a few seconds; it does not linger.

5. **Abrupt disconnect cleanup (Edge Case, FR-005)**
   - Force-kill window B's tab process (not a clean close) if feasible, or simulate by
     killing the network request.
   - Expected: B's avatar still disappears from window A within a bounded time.

6. **Brief reconnection (Story 3, SC-004)**
   - In window B, toggle network connectivity off for a few seconds, then back on (e.g. via
     browser devtools "offline" mode).
   - Expected: window B automatically resumes syncing without a manual reload; window A sees
     B's avatar continue updating without any action needed on A's side.

7. **Grace-period timeout (Edge Case, FR-009)**
   - In window B, go offline for longer than the configured reconnection grace period.
   - Expected: B is eventually treated as a full leave — its avatar disappears from window A
     (Story 2 behavior), even though it never received an explicit "leave" action from B.

8. **Restart resets everyone (Edge Case, FR-007)**
   - With both windows connected, restart the `apps/server` process.
   - Expected: both clients are disconnected; rejoining starts fresh with no prior state
     restored.
