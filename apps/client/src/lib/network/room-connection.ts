import type { Room } from '@colyseus/sdk'
import type { AvatarDirection, AvatarMotionState, AvatarSpriteType } from '@kangeikai/shared'
import { Client } from '@colyseus/sdk'

/**
 * Mirrors contracts/office-room-protocol.md's OfficeJoinOptions — keep in sync with
 * apps/server's message-schemas.ts if this shape changes (contract's "Stability" section).
 */
export interface OfficeJoinOptions {
  spriteType: AvatarSpriteType
}

/** Mirrors contracts/office-room-protocol.md's UpdateStatePayload. */
export interface UpdateStatePayload {
  x: number
  y: number
  direction: AvatarDirection
  motionState: AvatarMotionState
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected'

type ConnectionStateListener = (state: ConnectionState) => void

const DEFAULT_SERVER_URL = 'ws://localhost:2567'

/**
 * Connects to the single shared "office" room and exposes connection-state events. Position
 * sending (T014) and remote-state event wiring (T015) land in Phase 3; automatic reconnection
 * (T022) lands in Phase 5.
 */
export class RoomConnection {
  private readonly client: Client
  private room: Room | undefined
  private readonly listeners = new Set<ConnectionStateListener>()

  constructor(serverUrl: string = DEFAULT_SERVER_URL) {
    this.client = new Client(serverUrl)
  }

  onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async connect(options: OfficeJoinOptions): Promise<void> {
    this.emit('connecting')
    try {
      this.room = await this.client.joinOrCreate('office', options)
      this.room.onLeave(() => this.emit('disconnected'))
      this.emit('connected')
    }
    catch (error) {
      this.emit('disconnected')
      throw error
    }
  }

  disconnect(): void {
    void this.room?.leave()
    this.room = undefined
  }

  private emit(state: ConnectionState): void {
    for (const listener of this.listeners) {
      listener(state)
    }
  }
}
