import type { Application, Request, Response } from 'express'
import process from 'node:process'
import express from 'express'
import { AccessToken } from 'livekit-server-sdk'
import * as v from 'valibot'

/** The single, fixed, well-known LiveKit room every participant joins (contract). */
const PROXIMITY_ROOM_NAME = 'office'

/** Client→server request body (contracts/livekit-token-endpoint.md's LiveKitTokenRequest). */
const liveKitTokenRequestSchema = v.object({
  identity: v.pipe(v.string(), v.nonEmpty()),
  name: v.pipe(v.string(), v.nonEmpty()),
})

export function registerLiveKitTokenRoute(app: Application): void {
  app.post('/livekit-token', express.json(), (req: Request, res: Response) => {
    const result = v.safeParse(liveKitTokenRequestSchema, req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid request body' })
      return
    }

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    if (!url || !apiKey || !apiSecret) {
      res.status(500).json({ error: 'LiveKit is not configured' })
      return
    }

    const { identity, name } = result.output
    const token = new AccessToken(apiKey, apiSecret, { identity, name })
    token.addGrant({ room: PROXIMITY_ROOM_NAME, roomJoin: true, canPublish: true, canSubscribe: true })

    token.toJwt()
      .then(jwt => res.json({ token: jwt, url }))
      .catch((error: unknown) => {
        console.error('kangeikai: failed to mint LiveKit token', error)
        res.status(500).json({ error: 'Failed to mint token' })
      })
  })
}
