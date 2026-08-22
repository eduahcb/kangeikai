import type { AvatarState } from '@kangeikai/shared'
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

  constructor(tokenEndpoint: string = DEFAULT_TOKEN_ENDPOINT) {
    this.tokenEndpoint = tokenEndpoint
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
   * `identity` to their synced avatar position (feature 002), computes distance from the
   * local avatar, and applies `proximityVolume` to their microphone track (FR-002/FR-003).
   * Zone-membership override (FR-011) lands in a later phase.
   */
  update(localPosition: AvatarPosition, remotePositions: ReadonlyMap<string, AvatarPosition>): void {
    for (const [identity, participant] of this.room.remoteParticipants) {
      const remotePosition = remotePositions.get(identity)
      if (!remotePosition) {
        continue
      }

      const distance = Math.hypot(remotePosition.x - localPosition.x, remotePosition.y - localPosition.y)
      participant.setVolume(proximityVolume(distance, HEARING_RANGE_PX))
    }
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
