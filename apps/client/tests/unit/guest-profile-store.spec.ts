import type { GuestProfile } from '$lib/entry/guest-profile-schema'
import { GUEST_PROFILE_STORAGE_KEY } from '$lib/entry/constants'
import { GuestProfileStore } from '$lib/entry/guest-profile-store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createMockStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
    clear: () => data.clear(),
    key: index => [...data.keys()][index] ?? null,
    get length() { return data.size },
  }
}

describe('guestProfileStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when nothing is stored', () => {
    expect(new GuestProfileStore().load()).toBeNull()
  })

  it('round-trips a saved profile', () => {
    const store = new GuestProfileStore()
    const profile: GuestProfile = { displayName: 'Eduardo', avatarType: 'woman' }

    store.save(profile)

    expect(store.load()).toEqual(profile)
  })

  it('save() replaces any previously stored profile', () => {
    const store = new GuestProfileStore()

    store.save({ displayName: 'First', avatarType: 'man' })
    store.save({ displayName: 'Second', avatarType: 'woman' })

    expect(store.load()).toEqual({ displayName: 'Second', avatarType: 'woman' })
  })

  it('load() degrades to null when localStorage throws (FR-007)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage disabled')
      },
    })

    expect(new GuestProfileStore().load()).toBeNull()
  })

  it('save() silently does nothing when localStorage throws (FR-007)', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('storage disabled')
      },
    })

    expect(() => new GuestProfileStore().save({ displayName: 'Eduardo', avatarType: 'man' })).not.toThrow()
  })

  it('falls back to a valid avatarType while preserving a valid stored displayName (FR-008)', () => {
    localStorage.setItem(GUEST_PROFILE_STORAGE_KEY, JSON.stringify({ displayName: 'Eduardo', avatarType: 'robot' }))

    expect(new GuestProfileStore().load()).toEqual({ displayName: 'Eduardo', avatarType: 'man' })
  })
})
