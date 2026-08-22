import { generateDefaultName } from '$lib/entry/default-name'
import { describe, expect, it } from 'vitest'

describe('generateDefaultName', () => {
  it('always returns a non-blank string', () => {
    for (let i = 0; i < 50; i++) {
      const name = generateDefaultName()
      expect(name.trim().length).toBeGreaterThan(0)
    }
  })
})
