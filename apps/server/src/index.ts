import process from 'node:process'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { Server } from 'colyseus'
import { OfficeRoom } from './rooms/office-room'

const PORT = Number(process.env.PORT ?? 2567)

async function main(): Promise<void> {
  const server = new Server({
    transport: new WebSocketTransport(),
  })

  server.define('office', OfficeRoom)

  await server.listen(PORT)
  console.warn(`kangeikai server listening on ws://localhost:${PORT}`)
}

void main()
