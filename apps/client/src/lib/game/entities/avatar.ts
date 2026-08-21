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
 * The purchased character sheets (`avatar-{man,woman}-{idle,walk}.png`, 768×64px, 32px-wide
 * frames — a character-builder export from itch.io) pack all four directions into one row, six
 * frames each, in **right, up, left, down** order (confirmed by the asset's owner — no
 * accompanying frame documentation ships with it).
 */
export const AVATAR_FRAME_RANGES: Record<AvatarDirection, { start: number, end: number }> = {
  right: { start: 0, end: 5 },
  up: { start: 6, end: 11 },
  left: { start: 12, end: 17 },
  down: { start: 18, end: 23 },
}

const MOTION_STATE_SEGMENT: Record<AvatarMotionState, 'idle' | 'walk'> = {
  idle: 'idle',
  walking: 'walk',
}

export interface SpriteAnimation {
  /** Matches the Phaser animation key OfficeScene creates from AVATAR_FRAME_RANGES. */
  key: string
}

export function getSpriteAnimation(spriteType: AvatarSpriteType, motionState: AvatarMotionState, direction: AvatarDirection): SpriteAnimation {
  return {
    key: `${spriteType}-${MOTION_STATE_SEGMENT[motionState]}-${direction}`,
  }
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
