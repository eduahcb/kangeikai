import * as v from 'valibot'

/**
 * Literal lists mirror packages/shared/src/avatar.ts's AvatarDirection/AvatarMotionState/
 * AvatarSpriteType unions — keep both in sync if those change (contracts/office-room-
 * protocol.md's "Stability" section).
 */
const directionSchema = v.picklist(['up', 'down', 'left', 'right'])
const motionStateSchema = v.picklist(['idle', 'walking'])
const spriteTypeSchema = v.picklist(['man', 'woman'])

/** Client→server join payload (contracts/office-room-protocol.md's OfficeJoinOptions). */
export const officeJoinOptionsSchema = v.object({
  spriteType: spriteTypeSchema,
})

/** Client→server "updateState" message payload (contracts/office-room-protocol.md). */
export const updateStatePayloadSchema = v.object({
  x: v.number(),
  y: v.number(),
  direction: directionSchema,
  motionState: motionStateSchema,
})

export type OfficeJoinOptions = v.InferOutput<typeof officeJoinOptionsSchema>
export type UpdateStatePayload = v.InferOutput<typeof updateStatePayloadSchema>
