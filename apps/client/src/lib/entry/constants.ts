/** Enforced on the display name (FR-003) — chosen as generous enough for any real name. */
export const MAX_NAME_LENGTH = 24

/** Single `localStorage` key the whole `GuestProfile` blob is stored under (data-model.md). */
export const GUEST_PROFILE_STORAGE_KEY = 'kangeikai:guest-profile'

/** Combined with a noun and a number by `generateDefaultName()` (FR-006, research.md). */
export const DEFAULT_NAME_ADJECTIVES = [
  'Quiet',
  'Curious',
  'Sunny',
  'Swift',
  'Gentle',
  'Bold',
  'Cheerful',
  'Calm',
] as const

/** Combined with an adjective and a number by `generateDefaultName()` (FR-006, research.md). */
export const DEFAULT_NAME_NOUNS = [
  'Fox',
  'Otter',
  'Sparrow',
  'Panda',
  'Heron',
  'Lynx',
  'Rabbit',
  'Owl',
] as const
