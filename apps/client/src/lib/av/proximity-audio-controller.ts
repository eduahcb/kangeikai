import { Room } from 'livekit-client'

const DEFAULT_TOKEN_ENDPOINT = 'http://localhost:2567/livekit-token'

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

  async connect(options: ProximityAudioControllerOptions): Promise<void> {
    const { token, url } = await this.fetchToken(options)
    await this.room.connect(url, token)
  }

  disconnect(): void {
    void this.room.disconnect()
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
