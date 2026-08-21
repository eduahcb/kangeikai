import { Avatar } from '$lib/game/entities/avatar'
import { describe, expect, it } from 'vitest'

describe('avatar', () => {
  it('clamps position to the map bounds instead of walking off the edge', () => {
    const mapWidthPx = 320
    const mapHeightPx = 320
    const avatar = new Avatar(0, 0, 'man', mapWidthPx, mapHeightPx)

    avatar.update({ direction: 'left' }, 10)
    expect(avatar.x).toBe(0)

    avatar.update({ direction: 'up' }, 10)
    expect(avatar.y).toBe(0)

    avatar.x = mapWidthPx
    avatar.y = mapHeightPx
    avatar.update({ direction: 'right' }, 10)
    expect(avatar.x).toBe(mapWidthPx)

    avatar.update({ direction: 'down' }, 10)
    expect(avatar.y).toBe(mapHeightPx)
  })
})
