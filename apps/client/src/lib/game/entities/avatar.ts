import type { MovementIntent } from '$lib/game/input/movement-controller'
import type { AvatarDirection, AvatarMotionState, AvatarSpriteType, AvatarState } from '@kangeikai/shared'

const SPEED_PX_PER_SECOND = 160

const DIRECTION_VECTORS: Record<AvatarDirection, { x: number, y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

/**
 * Pure position/state logic, decoupled from Phaser rendering (research.md's testability
 * approach) — OfficeScene owns the visual representation and reads `getState()` each frame to
 * sync it. No obstacle collision yet (tasks.md T013 known gap): position updates unconditionally
 * on movement intent until T021 clamps it against the map's collision layer.
 */
export class Avatar {
  x: number
  y: number
  direction: AvatarDirection = 'down'
  motionState: AvatarMotionState = 'idle'
  readonly spriteType: AvatarSpriteType

  constructor(spawnX: number, spawnY: number, spriteType: AvatarSpriteType) {
    this.x = spawnX
    this.y = spawnY
    this.spriteType = spriteType
  }

  update(intent: MovementIntent, deltaSeconds: number): void {
    if (intent.direction) {
      this.direction = intent.direction
      this.motionState = 'walking'
      const vector = DIRECTION_VECTORS[intent.direction]
      this.x += vector.x * SPEED_PX_PER_SECOND * deltaSeconds
      this.y += vector.y * SPEED_PX_PER_SECOND * deltaSeconds
    }
    else {
      this.motionState = 'idle'
    }
  }

  getState(): AvatarState {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
      motionState: this.motionState,
      spriteType: this.spriteType,
    }
  }
}
