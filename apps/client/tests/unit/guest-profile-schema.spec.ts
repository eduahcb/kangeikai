import { MAX_NAME_LENGTH } from '$lib/entry/constants'
import { avatarTypeSchema, displayNameSchema } from '$lib/entry/guest-profile-schema'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'

describe('displayNameSchema', () => {
  it('accepts a normal name, trimmed', () => {
    expect(v.parse(displayNameSchema, '  Eduardo  ')).toBe('Eduardo')
  })

  it('rejects an empty name', () => {
    expect(v.safeParse(displayNameSchema, '').success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    expect(v.safeParse(displayNameSchema, '   ').success).toBe(false)
  })

  it('clamps a name longer than MAX_NAME_LENGTH rather than rejecting it (FR-003)', () => {
    const result = v.safeParse(displayNameSchema, 'x'.repeat(100))
    expect(result.success).toBe(true)
    expect(result.success && result.output.length).toBeLessThanOrEqual(MAX_NAME_LENGTH)
  })
})

describe('avatarTypeSchema', () => {
  it('accepts the two valid avatar types', () => {
    expect(v.parse(avatarTypeSchema, 'man')).toBe('man')
    expect(v.parse(avatarTypeSchema, 'woman')).toBe('woman')
  })

  it('rejects anything else', () => {
    expect(v.safeParse(avatarTypeSchema, 'robot').success).toBe(false)
  })
})
