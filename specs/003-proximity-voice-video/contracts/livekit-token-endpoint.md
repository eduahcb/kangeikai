# Contract: LiveKit Token Endpoint

An HTTP endpoint on the existing `apps/server` process, used by `apps/client` to obtain a
scoped LiveKit access token before joining the shared proximity audio/video room.

## `POST /livekit-token`

**Request body**:

```ts
interface LiveKitTokenRequest {
  identity: string; // MUST equal the participant's Colyseus sessionId (see research.md)
  name: string;      // Guest display name, chosen in the guest entry flow feature (004)
}
```

**Response body**:

```ts
interface LiveKitTokenResponse {
  token: string; // Signed LiveKit JWT access token, scoped to the single shared room
  url: string;    // The LiveKit server's WebSocket URL for the client SDK to connect to
}
```

**Server behavior**:
- Validates the request body against a Valibot schema (`identity` and `name` both required,
  non-empty strings) before doing anything else — this is a system boundary (untrusted input
  from the client over HTTP), per constitution Principle V. A validation failure returns an
  error response and never reaches the token-minting step.
- Uses `livekit-server-sdk` to mint a token granting join access to exactly one, fixed,
  well-known room name (the single shared space — no room selection).
- Reads LiveKit connection/signing configuration (`LIVEKIT_URL`, `LIVEKIT_API_KEY`,
  `LIVEKIT_API_SECRET`) from server environment configuration — these point at the
  self-hosted LiveKit deployment, which is provisioned separately (deploy work, out of scope
  of this feature).
- Stateless: no session record is created or stored server-side; the token itself carries
  everything LiveKit needs to authorize the connection.

## Stability

`identity` MUST stay equal to the Colyseus `sessionId` for the same connection — this is the
join key `ProximityAudioController` uses to match a LiveKit participant to that participant's
synced avatar position (data-model.md `ProximityRelationship.remoteSessionId`). Changing this
correlation requires updating this endpoint, `proximity-audio-controller.ts`, and the guest entry
flow feature (004) together.
