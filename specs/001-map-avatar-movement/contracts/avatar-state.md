# Contract: AvatarState (internal, cross-feature)

This is not a network/API contract — it's the shared TypeScript shape this feature produces
for the local player, which `002-realtime-multiplayer-sync` mirrors when broadcasting/
receiving remote players' state. Defining it once in `packages/shared/src/avatar.ts` keeps
the two features from drifting into incompatible shapes.

```ts
export type AvatarDirection = "up" | "down" | "left" | "right";
export type AvatarMotionState = "idle" | "walking";
export type AvatarSpriteType = "man" | "woman";

export interface AvatarState {
  x: number;
  y: number;
  direction: AvatarDirection;
  motionState: AvatarMotionState;
  spriteType: AvatarSpriteType;
}
```

**Producer (this feature)**: `apps/client/src/lib/game/entities/Avatar.ts` computes and owns
this state for the local player each frame, driven by `MovementController`.

**Consumers**:
- `002-realtime-multiplayer-sync`: reads the local player's `AvatarState` to broadcast it, and
  writes remote players' `AvatarState` to render other avatars using the same rendering unit.
- `004-guest-entry-flow`: sets the initial `spriteType` (and implicitly the spawn `x`/`y`)
  before this feature's scene starts; does not read state back.

**Stability**: Changing this shape requires updating both this feature and
`002-realtime-multiplayer-sync` together — treat it as a shared contract, not a
001-local-only type.
