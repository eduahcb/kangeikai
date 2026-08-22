import type { Zone } from '$lib/game/map/zone-lookup'
import { zoneAt } from '$lib/game/map/zone-lookup'
import { describe, expect, it } from 'vitest'

const zones: Zone[] = [
  { name: 'desk-01', x: 0, y: 0, width: 100, height: 100 },
  { name: 'public-space-01', x: 200, y: 0, width: 100, height: 100 },
]

describe('zoneAt', () => {
  it('returns the zone name for a point inside its bounds', () => {
    expect(zoneAt(zones, 50, 50)).toBe('desk-01')
    expect(zoneAt(zones, 250, 50)).toBe('public-space-01')
  })

  it('treats bounds as inclusive of the zone edges', () => {
    expect(zoneAt(zones, 0, 0)).toBe('desk-01')
    expect(zoneAt(zones, 100, 100)).toBe('desk-01')
  })

  it('returns null outside every zone', () => {
    expect(zoneAt(zones, 150, 50)).toBeNull()
  })

  it('returns null when there are no zones', () => {
    expect(zoneAt([], 50, 50)).toBeNull()
  })
})
