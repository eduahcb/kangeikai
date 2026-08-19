# Quickstart: Guest Entry Flow

## Prerequisites

- `apps/client` dev server runnable locally.
- Browser devtools available to inspect/clear `localStorage` and to simulate it being
  disabled/throwing (e.g. via a private-browsing mode known to restrict storage, or by
  overriding `window.localStorage` in the console).

## Validation Scenarios

1. **First-time visit shows the entry prompt with a default name (Story 1, Story 3)**
   - Clear `localStorage` for the app's origin, then open the app.
   - Expected: an entry form appears before the shared space, with a non-blank default
     display name pre-filled and no avatar type pre-selected (or a sensible default
     selected) — the person has not yet entered the space.

2. **Empty name is blocked (Story 1, FR-002, SC-003)**
   - Clear the pre-filled name field entirely (or fill it with only spaces) and try to
     confirm.
   - Expected: entry is blocked; the form indicates the name is required.

3. **Successful entry with name + avatar (Story 1)**
   - Enter a valid name, pick an avatar type, confirm.
   - Expected: the person enters the shared space using that name/avatar type.

4. **Returning visit pre-fills the previous choice (Story 2, SC-002)**
   - After Scenario 3, reload the app in the same browser.
   - Expected: the entry form is pre-filled with the same name and avatar type chosen last
     time.

5. **Changing and re-confirming updates the stored profile (Story 2)**
   - From the pre-filled form, change the name and/or avatar type, confirm.
   - Expected: entering the space uses the new values; reloading again shows the new values
     pre-filled (the old ones are gone).

6. **Corrupted stored profile falls back gracefully (Edge Case, FR-008)**
   - Manually edit the app's `localStorage` entry to an invalid shape (e.g. an invalid
     `avatarType` value) via devtools, then reload.
   - Expected: the entry form still renders correctly, falling back to a valid avatar type
     rather than erroring.

7. **Local storage unavailable still allows entry (Edge Case, FR-007, SC-004)**
   - Simulate `localStorage` being unavailable or throwing (e.g. override
     `window.localStorage` in devtools before loading the page).
   - Expected: the entry form still works and entry still succeeds; the app simply behaves
     as if every visit were a first-time visit (no persistence, no crash).

8. **Long name is clamped (Edge Case, FR-003)**
   - Enter a very long display name (well beyond a normal name's length) and confirm.
   - Expected: the stored/used name is clamped to the maximum length rather than accepted
     in full or rejected outright.
