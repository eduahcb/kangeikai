import { proximityVolume } from '$lib/av/proximity-volume'
import { describe, expect, it } from 'vitest'

describe('proximityVolume', () => {
  it('is 1 at distance 0', () => {
    expect(proximityVolume(0, 200)).toBe(1)
  })

  it('is 0 at the hearing-range threshold', () => {
    expect(proximityVolume(200, 200)).toBe(0)
  })

  it('is 0 beyond the hearing-range threshold', () => {
    expect(proximityVolume(500, 200)).toBe(0)
  })

  it('is monotonically non-increasing as distance increases across the range', () => {
    const range = 200
    const samples = Array.from({ length: 21 }, (_, i) => proximityVolume(i * (range / 20), range))

    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1])
    }
  })

  it('clamps output to [0, 1]', () => {
    expect(proximityVolume(-50, 200)).toBe(1)
    expect(proximityVolume(1000, 200)).toBe(0)
  })
})
