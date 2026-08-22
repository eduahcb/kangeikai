import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { computeSessionProof, verifySessionProof } from '../../src/session-proof'

describe('sessionProof', () => {
  beforeEach(() => {
    process.env.SESSION_SIGNING_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.SESSION_SIGNING_SECRET
  })

  it('computes a deterministic proof for the same sessionId', () => {
    expect(computeSessionProof('abc')).toBe(computeSessionProof('abc'))
  })

  it('computes different proofs for different sessionIds', () => {
    expect(computeSessionProof('abc')).not.toBe(computeSessionProof('xyz'))
  })

  it('verifies a matching proof', () => {
    const proof = computeSessionProof('abc')
    expect(verifySessionProof('abc', proof)).toBe(true)
  })

  it('rejects a mismatched proof', () => {
    expect(verifySessionProof('abc', 'wrong')).toBe(false)
  })

  it('rejects a proof computed for a different sessionId', () => {
    const proof = computeSessionProof('other-session')
    expect(verifySessionProof('abc', proof)).toBe(false)
  })

  it('throws when SESSION_SIGNING_SECRET is not configured', () => {
    delete process.env.SESSION_SIGNING_SECRET
    expect(() => computeSessionProof('abc')).toThrow()
  })
})
