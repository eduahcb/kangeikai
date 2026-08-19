# Feature Specification: Guest Entry Flow

**Feature Branch**: `004-guest-entry-flow`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Let people enter the shared virtual office as a guest — choosing
a display name and one of two avatar types — with no account or login, remembering their
choice locally in the browser for next time. This is the front door of the Kangeikai MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join as a guest with a name and avatar (Priority: P1)

A person opens the app for the first time. Before entering the shared space, they're asked to
type a display name and pick one of two avatar types. Once they confirm, they enter the space
using that identity.

**Why this priority**: This is the front door — nobody enters the shared space without going
through it, and every other feature (movement, presence sync, proximity chat) depends on the
identity chosen here.

**Independent Test**: Open the app with no prior local data, confirm the entry prompt appears,
fill in a name, pick an avatar type, confirm, and verify the person then enters the shared
space with that identity applied.

**Acceptance Scenarios**:

1. **Given** a person opens the app for the first time, **When** they have not chosen a name/
   avatar yet, **Then** they see a prompt to enter a display name and pick one of the two
   avatar types before entering the shared space.
2. **Given** a person has entered a valid name and selected an avatar type, **When** they
   confirm, **Then** they enter the shared space with that name and avatar type applied.
3. **Given** a person tries to confirm with an empty or whitespace-only name, **When** they
   submit, **Then** they are prevented from entering and shown what's missing.

---

### User Story 2 - Remembered locally for next time (Priority: P2)

Returning to the app in the same browser pre-fills the previously chosen name and avatar, so
the person doesn't have to redo it — though they can still change it before entering.

**Why this priority**: A clear quality-of-life improvement for repeat visits, but the product
is fully usable without it (Story 1 alone lets anyone enter every time); it builds on Story 1
existing.

**Independent Test**: Complete Story 1's flow once, reload the app in the same browser, and
confirm the entry form is pre-filled with the same name/avatar type.

**Acceptance Scenarios**:

1. **Given** a person previously joined and chose a name/avatar in this browser, **When** they
   return to the app, **Then** the entry form is pre-filled with their previous choice.
2. **Given** the pre-filled form, **When** the person changes the name or avatar type and
   confirms, **Then** the new choice is saved locally and used going forward, replacing the
   old one.

---

### User Story 3 - Quick entry with a sensible default name (Priority: P3)

A first-time visitor sees a friendly default display name already filled in, so they can just
pick an avatar and go rather than being forced to type something.

**Why this priority**: Friction reduction for a "just let me look around" visit. Strictly a UX
nicety — a visitor could always type their own name — so it's the lowest priority of the
three.

**Acceptance Scenarios**:

1. **Given** a person has never chosen a name before in this browser, **When** they see the
   entry form, **Then** a default display name is already filled in (not blank), which they
   may keep or change.

**Independent Test**: Open the app with no prior local data and confirm the name field is
pre-filled with a non-blank default rather than empty.

---

### Edge Cases

- What happens if local storage is unavailable or disabled (e.g. certain private-browsing
  modes)? The person MUST still be able to enter the shared space — the app behaves as if it
  were a first-time visit every time, rather than breaking.
- What happens if a stored display name is unusually long? The system MUST enforce a
  reasonable maximum length on the name field.
- What happens if a person opens the app in two tabs and changes their name in one? Out of
  scope for the MVP — each tab's entry flow is independent; there is no cross-tab sync
  requirement.
- What happens if a previously stored avatar-type value is missing or no longer valid (e.g.
  corrupted local storage)? The system MUST fall back to one of the two valid avatar types
  rather than erroring.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present an entry step, before joining the shared space, where the
  person chooses a display name and one of exactly two avatar types.
- **FR-002**: System MUST prevent entering the shared space with an empty or whitespace-only
  display name.
- **FR-003**: System MUST enforce a reasonable maximum length on the display name.
- **FR-004**: System MUST persist the chosen display name and avatar type in the browser's
  local storage after a successful entry.
- **FR-005**: System MUST pre-fill the entry form with the previously stored name/avatar type
  on a returning visit in the same browser, while still allowing the person to change either
  before entering.
- **FR-006**: System MUST pre-fill a friendly, non-blank default display name when no
  previous choice exists for this browser.
- **FR-007**: System MUST allow the person to enter the shared space even when local storage
  is unavailable or disabled, without erroring, treating that visit like a first-time visit.
- **FR-008**: System MUST fall back to one of the two valid avatar types if a stored
  avatar-type value is missing or invalid.
- **FR-009**: Upon confirming entry, system MUST hand off the chosen display name and avatar
  type to the rest of the application so movement, presence sync, and proximity chat all
  reflect the same chosen identity consistently.

### Key Entities

- **Guest Profile**: A client-only identity — display name and avatar type — stored in the
  browser's local storage, scoped to that browser only. No server-side representation of it
  is ever created (consistent with the project having no accounts or backend identity).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from opening the app to entering the shared space in
  a small number of steps — it reads as "just walk in," not a signup flow.
- **SC-002**: A returning visitor's previous name/avatar choice is pre-filled without
  re-typing, on the same browser, in 100% of cases where local storage is available.
- **SC-003**: No visitor can enter the shared space with a blank display name.
- **SC-004**: Entry succeeds even when local storage is disabled or unavailable, in 100% of
  tested cases — no crash or blocking error.

## Assumptions

- No accounts and no server-side identity exist anywhere in the MVP; persistence is entirely
  local to the browser (per project constitution) — a different browser or device always
  starts fresh.
- Avatar type is exactly one of two fixed values (per project constitution and feature 001).
- The default display name (Story 3) is generated entirely client-side; no server call is
  needed to produce it.
- This feature owns the pre-join entry step; the map/avatar rendering (feature 001) and
  realtime join (feature 002) begin only after this feature's entry step is confirmed.
