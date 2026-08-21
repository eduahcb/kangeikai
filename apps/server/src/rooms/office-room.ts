import type { Client } from 'colyseus'
import { CloseCode, Room } from 'colyseus'
import * as v from 'valibot'
import { officeJoinOptionsSchema, updateStatePayloadSchema } from './message-schemas'
import { AvatarSchema } from './schema/avatar-schema'
import { OfficeRoomState } from './schema/office-room-state'

/**
 * Placeholder spawn point, matching apps/client's office-scene.ts SPAWN_X/SPAWN_Y — see that
 * file's comment on the map's current lack of a collision layer (same known gap applies here).
 */
const SPAWN_X = 150
const SPAWN_Y = 150

/** Bounded reconnection grace period for an ungraceful disconnect (FR-005, FR-008, FR-009). */
const RECONNECTION_GRACE_PERIOD_SECONDS = 15

export class OfficeRoom extends Room<{ state: OfficeRoomState }> {
  onCreate(): void {
    this.setState(new OfficeRoomState())

    this.onMessage('updateState', (client, message) => {
      const result = v.safeParse(updateStatePayloadSchema, message)
      if (!result.success) {
        return
      }

      const avatar = this.state.players.get(client.sessionId)
      if (!avatar) {
        return
      }

      avatar.x = result.output.x
      avatar.y = result.output.y
      avatar.direction = result.output.direction
      avatar.motionState = result.output.motionState
    })
  }

  onJoin(client: Client, options: unknown): void {
    const { spriteType } = v.parse(officeJoinOptionsSchema, options)

    const avatar = new AvatarSchema()
    avatar.spriteType = spriteType
    avatar.x = SPAWN_X
    avatar.y = SPAWN_Y

    this.state.players.set(client.sessionId, avatar)
  }

  async onLeave(client: Client, code?: number): Promise<void> {
    const avatar = this.state.players.get(client.sessionId)
    this.state.players.delete(client.sessionId)

    if (!avatar || code === CloseCode.CONSENTED) {
      return
    }

    try {
      await this.allowReconnection(client, RECONNECTION_GRACE_PERIOD_SECONDS)
      this.state.players.set(client.sessionId, avatar)
    }
    catch {
      // Grace period elapsed without reconnecting — session is already removed above, so this
      // finalizes as a full leave (FR-009) with no further action needed.
    }
  }
}
