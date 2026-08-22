import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'
import process from 'node:process'

/**
 * Ties LiveKit token issuance to a real, currently-connected Colyseus session — closes a
 * security gap where `POST /livekit-token` accepted any `identity`/`name` with no
 * verification, letting anyone mint a token and join the shared room's audio/video without
 * ever going through the game. Stateless (an HMAC, not a tracked session map), matching
 * contracts/livekit-token-endpoint.md's existing "no session record is created or stored
 * server-side" design.
 */
function secret(): string {
  const value = process.env.SESSION_SIGNING_SECRET
  if (!value) {
    throw new Error('SESSION_SIGNING_SECRET is not configured')
  }
  return value
}

/** Computed once in `OfficeRoom.onJoin` and sent to that client as its "sessionProof" message. */
export function computeSessionProof(sessionId: string): string {
  return createHmac('sha256', secret()).update(sessionId).digest('hex')
}

/** Used by `/livekit-token` to confirm a submitted `identity` actually went through `onJoin`. */
export function verifySessionProof(sessionId: string, proof: string): boolean {
  const expected = Buffer.from(computeSessionProof(sessionId))
  const actual = Buffer.from(proof)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
