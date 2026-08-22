import process from 'node:process'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { Server } from 'colyseus'
import { registerLiveKitTokenRoute } from './http/livekit-token'
import { OfficeRoom } from './rooms/office-room'

const PORT = Number(process.env.PORT ?? 2567)

async function main(): Promise<void> {
  const server = new Server({
    transport: new WebSocketTransport(),
    express: (app) => {
      registerLiveKitTokenRoute(app)
    },
  })

  server.define('office', OfficeRoom)

  await server.listen(PORT)
  console.warn(`kangeikai server listening on ws://localhost:${PORT}`)
}

void main()
