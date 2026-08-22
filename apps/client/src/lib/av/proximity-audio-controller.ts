import type { Zone } from '$lib/game/map/zone-lookup'
import type { AvatarState } from '@kangeikai/shared'
import { zoneAt } from '$lib/game/map/zone-lookup'
import { Room } from 'livekit-client'
import { proximityVolume } from './proximity-volume'

const DEFAULT_TOKEN_ENDPOINT = 'http://localhost:2567/livekit-token'

/**
 * Fixed hearing-range threshold in map pixels (spec.md Assumptions: tuned during
 * implementation, not user-configurable in the MVP) — ~6 tiles at feature 001's 32px tiles.
 */
const HEARING_RANGE_PX = 200

export type AvatarPosition = Pick<AvatarState, 'x' | 'y'>

/** Mirrors contracts/livekit-token-endpoint.md's LiveKitTokenRequest. */
export interface ProximityAudioControllerOptions {
  /** MUST equal the participant's Colyseus sessionId (contract's "Stability" section). */
  identity: string
  name: string
}

/** Mirrors contracts/livekit-token-endpoint.md's LiveKitTokenResponse. */
interface LiveKitTokenResponse {
  token: string
  url: string
}

/**
 * Fetches a scoped token from `/livekit-token` and connects to the single shared LiveKit
 * room. Per-participant proximity volume (US1) and media controls (US2/US3) land in later
 * phases.
 */
export class ProximityAudioController {
  private readonly room = new Room()
  private readonly tokenEndpoint: string
  private zones: readonly Zone[] = []

  constructor(tokenEndpoint: string = DEFAULT_TOKEN_ENDPOINT) {
    this.tokenEndpoint = tokenEndpoint
  }

  /** The map's named voice/video activation zones (feature 001's `zones` object layer). */
  setZones(zones: readonly Zone[]): void {
    this.zones = zones
  }

  /** The underlying LiveKit room, for `MediaControls`/video-overlay callers (US2). */
  get liveKitRoom(): Room {
    return this.room
  }

  /**
   * `_localPosition` exists only to make FR-008 a compile-time precondition — there is no
   * way to call this before the local avatar has a valid position. `update()` takes the
   * current position fresh on every frame instead, so the value itself isn't used here.
   */
  async connect(options: ProximityAudioControllerOptions, _localPosition: AvatarPosition): Promise<void> {
    const { token, url } = await this.fetchToken(options)
    await this.room.connect(url, token)
  }

  disconnect(): void {
    void this.room.disconnect()
  }

  /**
   * Called once per local animation frame: matches each connected LiveKit participant's
   * `identity` to their synced avatar position (feature 002), then sets that participant's
   * microphone volume to full when they share zone membership with the local avatar
   * (FR-011), otherwise to `proximityVolume` of the distance between them (FR-002/FR-003,
   * FR-012) — data-model.md's `ProximityRelationship.volume` rule.
   *
   * Returns the set of remote `identity`s that are currently audible (volume > 0) — "close
   * enough to hear" is also the video-visibility/muted-indicator condition for US2 (spec.md
   * acceptance scenarios), so callers reuse this instead of recomputing distance/zone
   * themselves.
   */
  update(localPosition: AvatarPosition, remotePositions: ReadonlyMap<string, AvatarPosition>): ReadonlySet<string> {
    const localZone = zoneAt(this.zones, localPosition.x, localPosition.y)
    const nearby = new Set<string>()

    for (const [identity, participant] of this.room.remoteParticipants) {
      const remotePosition = remotePositions.get(identity)
      if (!remotePosition) {
        continue
      }

      const sharedZone = localZone !== null && zoneAt(this.zones, remotePosition.x, remotePosition.y) === localZone
      const volume = sharedZone
        ? 1
        : proximityVolume(Math.hypot(remotePosition.x - localPosition.x, remotePosition.y - localPosition.y), HEARING_RANGE_PX)

      participant.setVolume(volume)
      if (volume > 0) {
        nearby.add(identity)
      }
    }

    return nearby
  }

  private async fetchToken(options: ProximityAudioControllerOptions): Promise<LiveKitTokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error(`kangeikai: failed to fetch LiveKit token (${response.status})`)
    }

    return response.json() as Promise<LiveKitTokenResponse>
  }
}
