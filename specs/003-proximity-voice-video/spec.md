# Feature Specification: Proximity Voice & Video

**Feature Branch**: `003-proximity-voice-video`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Let people talk to whoever is near their avatar in the shared
office space — as two avatars get closer, their voice/video connection ramps up automatically;
as they move apart, it fades — without needing to open a separate call. This is the headline
value proposition of the Kangeikai MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Talk to whoever is nearby, automatically (Priority: P1)

A person walks their avatar close to another person's avatar and starts hearing them, with the
volume increasing the closer they get. Walking away fades the volume back down until they can
no longer hear each other.

**Why this priority**: This is the headline feature — the thing that makes the product a
"virtual office" rather than just a shared map. Nothing else in the MVP matters if this doesn't
work.

**Independent Test**: Two participants join with microphones enabled, start far apart (unable
to hear each other), walk their avatars together, and confirm audio becomes audible and
increases as they approach; walk apart and confirm it fades.

**Acceptance Scenarios**:

1. **Given** two participants' avatars are far apart in the shared space, **When** they remain
   far apart, **Then** neither can hear the other.
2. **Given** two participants walk their avatars toward each other, **When** the distance
   between them decreases, **Then** each starts hearing the other, with perceived volume
   increasing as they get closer.
3. **Given** two participants are close enough to hear each other, **When** one walks away,
   **Then** the perceived volume decreases smoothly as distance increases, eventually
   becoming inaudible again.

---

### User Story 2 - See video and control your own mic/camera (Priority: P2)

Nearby participants can see each other's webcam video (when enabled), and each participant can
mute their own microphone or turn their camera on/off at will.

**Why this priority**: Video and self-controls round out the experience Gather-like products
are known for, but the audio-proximity mechanic (Story 1) is the core mechanism this builds on.

**Independent Test**: With two participants near each other and both hearing audio (Story 1
working), enable one's camera and confirm the other sees the video feed; mute one's mic and
confirm the other stops hearing them along with a visible muted indicator.

**Acceptance Scenarios**:

1. **Given** a participant has enabled their camera, **When** another participant is close
   enough to hear them, **Then** that nearby participant also sees their video feed.
2. **Given** a participant mutes their own microphone, **When** observed by nearby
   participants, **Then** those participants stop hearing them regardless of distance, and see
   a visible "muted" indicator on that participant.
3. **Given** a participant turns their own camera off, **When** observed by nearby
   participants, **Then** the video feed disappears for them.

---

### User Story 3 - Participate gracefully without a mic or camera (Priority: P3)

A person who denies the browser's microphone/camera permission (or has no such hardware) can
still fully move around and see/hear other people — they simply don't transmit their own
audio/video.

**Why this priority**: Real-world friction — some people will decline permissions or lack
hardware. This shouldn't be common, but when it happens the product must degrade gracefully
rather than breaking, so it's still important even at lower priority than the core mechanic.

**Independent Test**: Deny the camera/microphone permission prompt on join and confirm the
person can still move around, see other avatars, and hear nearby participants, without any
error blocking their use of the space.

**Acceptance Scenarios**:

1. **Given** a person joins the shared space for the first time, **When** their browser
   prompts for camera/microphone permission, **Then** accepting connects their own audio/video
   into proximity chat.
2. **Given** a person denies camera/microphone permission (or has no such device), **When**
   they continue using the space, **Then** they can still move around and hear/see nearby
   participants as a receiver, without the application breaking or blocking their
   participation — their own outgoing audio/video is simply absent.

---

### Edge Cases

- What happens if a person has neither a camera nor a microphone available at all (not just
  denied permission)? Same graceful degradation as Story 3's denial case.
- What happens if the proximity voice/video connection fails independently of avatar movement
  (movement keeps working, audio doesn't)? The two systems (movement/presence sync and
  proximity audio/video) MUST remain independent — a failure in one MUST NOT break the other.
- What happens when a person is near several other people at once? They MUST be able to hear
  each nearby participant simultaneously, each at a volume appropriate to that participant's
  individual distance.
- What happens the instant someone joins, before their avatar's position is known yet? No
  proximity audio/video connection is established for a participant until their own avatar has
  a valid position.
- What happens when two participants are in adjacent-but-different zones (e.g. `desk-01` and
  `desk-02`), physically close to each other? They do NOT share zone membership, so FR-011 does
  not apply — the distance-based model (FR-012) governs, same as if there were no zones there.
- What happens when a participant moves from inside a zone to outside it (or vice versa) while
  already connected to another participant? The connection MUST immediately re-evaluate under
  the applicable rule (FR-011 while both share a zone, FR-012 the moment they no longer do) —
  no stale "still full volume" state after leaving a shared zone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let participants transmit their microphone audio, and camera video
  when enabled, into the shared space, contingent on browser permission being granted.
- **FR-002**: System MUST compute each nearby participant's perceived volume for the local
  listener based on the distance between that participant's avatar and the local listener's
  avatar.
- **FR-003**: System MUST reduce a participant's perceived volume to effectively silent once
  the distance between their avatars exceeds a defined hearing-range threshold.
- **FR-004**: Users MUST be able to mute and unmute their own microphone; while muted, no
  other participant can hear them, regardless of distance.
- **FR-005**: Users MUST be able to turn their own camera on and off; other participants' view
  of that video feed MUST update accordingly.
- **FR-006**: System MUST show a visible indicator when a nearby participant is muted.
- **FR-007**: System MUST allow a participant to continue moving around and hearing/seeing
  others as a receiver even if they deny camera/microphone permission or lack the hardware,
  without breaking or blocking their participation.
- **FR-008**: System MUST NOT attempt to establish the local participant's proximity audio/
  video connection until their own avatar has a valid position from the realtime sync layer.
- **FR-009**: A failure in the proximity audio/video system MUST NOT prevent avatar movement/
  presence sync from continuing to function, and vice versa.
- **FR-010**: System MUST support multiple simultaneously-nearby participants, each
  contributing independently distance-weighted audio to the local listener at once.
- **FR-011**: System MUST treat two participants as fully connected (perceived volume `1`, video
  visible per Story 2) whenever their avatars share membership in the same zone (any
  `personal-desk` or `public-space` tagged zone, per feature 001's FR-010), regardless of the
  exact distance between them within that zone — shared zone membership overrides the
  distance-based falloff (FR-002/FR-003) rather than combining with it.
- **FR-012**: For any pair of participants that does NOT share zone membership (either or both
  are outside any zone, or they are in two different zones), System MUST fall back to the
  existing distance-based volume model (FR-002/FR-003) unchanged.

### Key Entities

- **Proximity Relationship**: The per-pair relationship between the local participant and one
  other nearby participant, characterized by the distance between their avatars and the
  resulting perceived volume of that participant's audio for the local listener. Recomputed
  continuously as avatars move.
- **Zone Membership**: Which single zone (if any) an avatar currently occupies, per feature
  001's `Zone` entity. When both avatars in a pair share the same zone, it overrides
  distance-based volume with full connection (FR-011); otherwise distance-based volume applies
  unchanged (FR-012).
- **Media State**: A participant's own microphone-enabled/camera-enabled/muted flags. Visible
  to nearby participants as indicators (e.g. FR-006's muted indicator) and as the presence or
  absence of a video feed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two participants within the hearing-range threshold can hear each other; the
  same two participants beyond that threshold cannot.
- **SC-002**: Perceived volume changes smoothly as the distance between two participants
  changes within the hearing range — no jarring cut-off or pop as they cross into/out of range.
- **SC-003**: A participant who denies camera/microphone permission can still fully use
  movement and presence features without any error state blocking them.
- **SC-004**: Muting takes effect immediately from nearby participants' perspective — no one
  continues to hear a participant who just muted.
- **SC-005**: A participant can simultaneously perceive audio from several distinctly nearby
  participants, each at a volume appropriate to its own distance.
- **SC-006**: Two participants anywhere within the same `personal-desk` or `public-space` zone
  hear/see each other at full volume/video, regardless of exact distance apart within that zone.
- **SC-007**: When one of two zone-mates leaves the shared zone (without the other), their
  connection immediately switches to the distance-based model — no lingering full volume.

## Assumptions

- All participants share a single audio/video room; proximity is simulated purely by
  client-side volume attenuation over that shared room (per project constitution) — there are
  no per-pair private connections and no server-side selective media routing in the MVP.
- The single shared map (feature 001) defines named, tagged zones (`personal-desk`,
  `public-space`) via its Tiled object layer. These zones do not create isolated-audio "meeting
  room" acoustics or server-side media routing — the shared room and client-side volume
  attenuation model from the point above still apply everywhere. Zone membership is an
  additional signal layered on top of distance (see FR-011), not a replacement for it. No
  private zones exist in the MVP.
- The hearing-range distance threshold is a fixed value tuned during implementation/testing,
  not user-configurable in the MVP.
- Camera/microphone hardware access and permission state are per-browser-session; there is no
  persisted preference across sessions, consistent with the project having no accounts or
  backend identity.
- Text captions/transcription are out of scope; this feature is audio/video only.
