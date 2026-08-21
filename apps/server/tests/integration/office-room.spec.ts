import type { Room as SDKRoom } from '@colyseus/sdk'
import type { ColyseusTestServer } from '@colyseus/testing'
import { boot } from '@colyseus/testing'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { Server } from 'colyseus'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { OfficeRoom } from '../../src/rooms/office-room'

let colyseus: ColyseusTestServer

beforeAll(async () => {
  const server = new Server({ transport: new WebSocketTransport() })
  server.define('office', OfficeRoom)
  colyseus = await boot(server)
})

afterEach(async () => {
  await colyseus.cleanup()
})

afterAll(async () => {
  await colyseus.shutdown()
})

/**
 * @colyseus/testing@0.17.11's built-in `waitForNextPatch()` is broken against the installed
 * @colyseus/sdk@0.17.43 (it monkey-patches a `Room.prototype.patch` method that no longer
 * exists in that SDK version, so the returned promise never resolves) — use the client room's
 * own public `onStateChange` signal instead.
 */
function nextStateChange(client: SDKRoom): Promise<void> {
  return new Promise(resolve => client.onStateChange.once(() => resolve()))
}

describe('officeRoom', () => {
  it('propagates position/direction/motion-state changes between two connected clients', async () => {
    const room = await colyseus.createRoom('office', { spriteType: 'man' })
    const clientA = await colyseus.connectTo(room, { spriteType: 'man' })
    const clientB = await colyseus.connectTo(room, { spriteType: 'woman' })

    // let clientB's initial full-state sync (both avatars already present) settle before
    // watching for the delta patch clientA's update below is expected to trigger
    await nextStateChange(clientB)

    const nextChange = nextStateChange(clientB)
    clientA.send('updateState', { x: 42, y: 84, direction: 'right', motionState: 'walking' })
    await nextChange

    const aFromB = clientB.state.players.get(clientA.sessionId)
    expect(aFromB?.x).toBe(42)
    expect(aFromB?.y).toBe(84)
    expect(aFromB?.direction).toBe('right')
    expect(aFromB?.motionState).toBe('walking')
  })
})
