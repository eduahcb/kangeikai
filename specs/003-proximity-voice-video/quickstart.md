# Quickstart: Proximity Voice & Video

## Prerequisites

- Run `docker compose -f docker-compose.livekit.yml up` from the repository root to start a
  local LiveKit dev server; its fixed dev URL/API key/secret match the defaults documented in
  `apps/server/.env.example` (`LIVEKIT_URL`/`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`) — no manual
  LiveKit install or account is needed.
- `apps/server` and `apps/client` running locally, with features 001/002 already working
  (map, avatar, movement, realtime sync).
- Two devices or browser profiles, each with a real (or virtual/loopback) microphone and
  camera, and browser permission prompts not pre-blocked.

## Validation Scenarios

1. **Out of range → silent (Story 1, SC-001)**
   - Join with two participants; keep avatars far apart on the map.
   - Expected: neither can hear the other.

2. **Approach → volume ramps up (Story 1, SC-001, SC-002)**
   - Walk the two avatars toward each other.
   - Expected: each starts hearing the other, volume increasing smoothly as distance
     decreases — no sudden jump or pop.

3. **Walk away → volume ramps down (Story 1, SC-002)**
   - From close proximity, walk one avatar away.
   - Expected: volume decreases smoothly, becoming inaudible again beyond the hearing range.

4. **Video appears for nearby participants (Story 2)**
   - With two avatars close together, enable camera on one.
   - Expected: the other participant sees the video feed positioned near that avatar.

5. **Mute takes effect immediately (Story 2, SC-004)**
   - With two avatars close together and both audible, mute one participant's microphone.
   - Expected: the other stops hearing them immediately and sees a muted indicator.

6. **Camera off removes the video tile (Story 2)**
   - Turn off a participant's camera while nearby.
   - Expected: the video feed disappears for the other participant.

7. **Multiple nearby participants at once (Edge Case, SC-005)**
   - With three or more participants, position two at different distances from a third.
   - Expected: the third hears both, at different volumes matching their respective
     distances.

8. **Permission denied still works (Story 3, SC-003)**
   - Join fresh and deny the camera/microphone permission prompt.
   - Expected: movement and seeing/hearing others still work fully; no error blocks
     participation; this participant transmits no audio/video of their own.

9. **Movement/proximity independence (Edge Case, FR-009)**
   - Simulate the LiveKit connection failing (e.g. wrong `LIVEKIT_URL`) while feature 002's
     realtime sync stays up.
   - Expected: avatar movement and presence sync (features 001/002) continue working
     normally despite the audio/video failure.
