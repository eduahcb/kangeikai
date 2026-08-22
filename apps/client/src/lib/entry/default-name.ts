import { DEFAULT_NAME_ADJECTIVES, DEFAULT_NAME_NOUNS } from './constants'

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Friendly, non-blank default display name (FR-006) — e.g. "Quiet Fox 42". Used both as the
 * pre-filled value for a first-time visitor and as the `guestProfileSchema` fallback for a
 * corrupted/missing stored `displayName` (research.md).
 */
export function generateDefaultName(): string {
  const adjective = randomItem(DEFAULT_NAME_ADJECTIVES)
  const noun = randomItem(DEFAULT_NAME_NOUNS)
  const number = Math.floor(Math.random() * 100)
  return `${adjective} ${noun} ${number}`
}
