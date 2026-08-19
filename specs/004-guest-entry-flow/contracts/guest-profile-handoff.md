# Contract: Guest Profile Handoff (internal, cross-feature)

Not a network contract — this documents what `004-guest-entry-flow` hands to the rest of the
application on successful entry confirmation (FR-009), and who consumes it.

```ts
interface GuestProfile {
  displayName: string;   // validated: non-empty, trimmed, ≤ MAX_NAME_LENGTH
  avatarType: "man" | "woman"; // AvatarSpriteType from packages/shared/src/avatar.ts
}
```

**Producer**: `apps/client/src/lib/entry/EntryForm.svelte`, on confirm, via
`apps/client/src/routes/+page.svelte`.

**Consumers**:
- `001-map-avatar-movement`: `avatarType` seeds the local `Avatar`'s `AvatarState.spriteType`
  (immutable for the session, per that feature's data-model.md).
- `002-realtime-multiplayer-sync`: `avatarType` is sent as part of `OfficeJoinOptions` when
  connecting to the shared room (see that feature's `contracts/office-room-protocol.md`).
- `003-proximity-voice-video`: `displayName` is sent as the `name` field of
  `LiveKitTokenRequest` (see that feature's `contracts/livekit-token-endpoint.md`); the
  request's `identity` field is the Colyseus `sessionId` assigned during 002's join, not
  anything from this feature.

**Stability**: `avatarType`'s two allowed values are shared with feature 001's
`AvatarSpriteType` — changing the set of valid avatar types requires updating both together.
