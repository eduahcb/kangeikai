export type AvatarDirection = 'up' | 'down' | 'left' | 'right'
export type AvatarMotionState = 'idle' | 'walking'
export type AvatarSpriteType = 'man' | 'woman'

export interface AvatarState {
  x: number
  y: number
  direction: AvatarDirection
  motionState: AvatarMotionState
  spriteType: AvatarSpriteType
}
