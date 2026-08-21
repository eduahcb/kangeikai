import { MapSchema, Schema, type } from '@colyseus/schema'
import { AvatarSchema } from './avatar-schema'

/**
 * players excludes any session currently inside its reconnection grace period
 * (data-model.md's validation rule) — enforced by office-room.ts, not by this class.
 */
export class OfficeRoomState extends Schema {
  @type({ map: AvatarSchema }) players = new MapSchema<AvatarSchema>()
}
