import type { MapSchema } from '@colyseus/schema'
import type { Room } from '@colyseus/sdk'
import type { AvatarDirection, AvatarMotionState, AvatarSpriteType, AvatarState } from '@kangeikai/shared'
import { Client, getStateCallbacks } from '@colyseus/sdk'

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
type RemoteAvatarListener = (sessionId: string, avatar: AvatarState) => void
type RemoteAvatarRemoveListener = (sessionId: string) => void

const DEFAULT_SERVER_URL = 'ws://localhost:2567'
/** Client→server position updates: on-change, capped ~20/sec (research.md). */
const SEND_INTERVAL_MS = 1000 / 20

interface OfficeRoomStateShape {
  players: MapSchema<AvatarState>
}

/**
 * Minimal room-shape declaration for SDK type inference — deliberately not importing
 * apps/server's actual OfficeRoom/AvatarSchema (separate deployable apps; only
 * packages/shared is shared cross-app). The client decodes room state via Colyseus's
 * reflection handshake regardless of this compile-time annotation.
 */
interface OfficeRoomLike {
  state: OfficeRoomStateShape
  onJoin: (client: unknown, options?: OfficeJoinOptions) => unknown
}

function statesEqual(a: UpdateStatePayload, b: UpdateStatePayload | undefined): boolean {
  return b !== undefined && a.x === b.x && a.y === b.y && a.direction === b.direction && a.motionState === b.motionState
}

function toAvatarSnapshot(avatar: AvatarState): AvatarState {
  return {
    x: avatar.x,
    y: avatar.y,
    direction: avatar.direction,
    motionState: avatar.motionState,
    spriteType: avatar.spriteType,
  }
}

/**
 * Connects to the single shared "office" room, throttles/sends the local avatar's state, and
 * exposes both connection-state and remote-avatar events.
 *
 * Automatic reconnection on an ungraceful drop (FR-008) is handled by `@colyseus/sdk`'s
 * `Room` itself (per research.md's decision to rely on Colyseus's built-in mechanism rather
 * than custom reconnect code): on an abnormal close it retries with backoff behind the
 * scenes, reusing the same `Room` instance/session — `onDrop`/`onReconnect` below only
 * surface that as connection-state events; `onLeave` only fires for a genuine leave (a
 * consented disconnect, or the retries giving up once the server's reconnection grace period
 * elapses, per FR-009).
 */
export class RoomConnection {
  private readonly client: Client
  private room: Room<OfficeRoomLike, OfficeRoomStateShape> | undefined

  private readonly connectionListeners = new Set<ConnectionStateListener>()
  private readonly remoteAddListeners = new Set<RemoteAvatarListener>()
  private readonly remoteChangeListeners = new Set<RemoteAvatarListener>()
  private readonly remoteRemoveListeners = new Set<RemoteAvatarRemoveListener>()

  private lastSentState: UpdateStatePayload | undefined
  private lastSentAt = 0
  private pendingPayload: UpdateStatePayload | undefined
  private pendingSend: ReturnType<typeof setTimeout> | undefined

  constructor(serverUrl: string = DEFAULT_SERVER_URL) {
    this.client = new Client(serverUrl)
  }

  onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener)
    return () => this.connectionListeners.delete(listener)
  }

  /** Fires once per remote participant already present or newly joining (excludes self). */
  onRemoteAvatarAdd(listener: RemoteAvatarListener): () => void {
    this.remoteAddListeners.add(listener)
    return () => this.remoteAddListeners.delete(listener)
  }

  /** Fires whenever a remote participant's avatar state changes. */
  onRemoteAvatarChange(listener: RemoteAvatarListener): () => void {
    this.remoteChangeListeners.add(listener)
    return () => this.remoteChangeListeners.delete(listener)
  }

  /** Fires when a remote participant disappears (leave, or reconnection grace period). */
  onRemoteAvatarRemove(listener: RemoteAvatarRemoveListener): () => void {
    this.remoteRemoveListeners.add(listener)
    return () => this.remoteRemoveListeners.delete(listener)
  }

  async connect(options: OfficeJoinOptions): Promise<void> {
    this.emitConnectionState('connecting')
    try {
      const room = await this.client.joinOrCreate<OfficeRoomLike>('office', options)
      this.room = room
      room.onLeave(() => this.emitConnectionState('disconnected'))
      room.onDrop(() => this.emitConnectionState('connecting'))
      room.onReconnect(() => this.emitConnectionState('connected'))
      this.bindRemoteAvatarEvents(room)
      this.emitConnectionState('connected')
    }
    catch (error) {
      this.emitConnectionState('disconnected')
      throw error
    }
  }

  disconnect(): void {
    if (this.pendingSend !== undefined) {
      clearTimeout(this.pendingSend)
      this.pendingSend = undefined
    }
    this.pendingPayload = undefined
    this.lastSentState = undefined
    void this.room?.leave()
    this.room = undefined
  }

  /**
   * Sends the local avatar's state if it changed since the last send, throttled to
   * SEND_INTERVAL_MS. A trailing send is scheduled when throttled so the final state right
   * before movement stops is never dropped.
   */
  sendState(payload: UpdateStatePayload): void {
    if (!this.room || statesEqual(payload, this.lastSentState)) {
      return
    }

    const elapsed = Date.now() - this.lastSentAt
    if (elapsed >= SEND_INTERVAL_MS) {
      this.flushSend(payload)
      return
    }

    this.pendingPayload = payload
    if (this.pendingSend === undefined) {
      this.pendingSend = setTimeout(() => {
        this.pendingSend = undefined
        if (this.pendingPayload) {
          this.flushSend(this.pendingPayload)
        }
      }, SEND_INTERVAL_MS - elapsed)
    }
  }

  private flushSend(payload: UpdateStatePayload): void {
    this.room?.send('updateState', payload)
    this.lastSentState = payload
    this.lastSentAt = Date.now()
    this.pendingPayload = undefined
  }

  private bindRemoteAvatarEvents(room: Room<OfficeRoomLike, OfficeRoomStateShape>): void {
    const callbacks = getStateCallbacks(room)

    callbacks(room.state).players.onAdd((avatar, sessionId) => {
      if (sessionId === room.sessionId) {
        return
      }
      this.emitRemoteAvatar(this.remoteAddListeners, sessionId, avatar)
      callbacks(avatar).onChange(() => this.emitRemoteAvatar(this.remoteChangeListeners, sessionId, avatar))
    })

    callbacks(room.state).players.onRemove((_avatar, sessionId) => {
      if (sessionId === room.sessionId) {
        return
      }
      for (const listener of this.remoteRemoveListeners) {
        listener(sessionId)
      }
    })
  }

  private emitRemoteAvatar(listeners: Set<RemoteAvatarListener>, sessionId: string, avatar: AvatarState): void {
    const snapshot = toAvatarSnapshot(avatar)
    for (const listener of listeners) {
      listener(sessionId, snapshot)
    }
  }

  private emitConnectionState(state: ConnectionState): void {
    for (const listener of this.connectionListeners) {
      listener(state)
    }
  }
}
