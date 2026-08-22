import type { GuestProfile } from './guest-profile-schema'
import * as v from 'valibot'
import { GUEST_PROFILE_STORAGE_KEY } from './constants'
import { guestProfileSchema } from './guest-profile-schema'

/**
 * Wraps `localStorage` for the single `GuestProfile` blob (data-model.md). Every read/write is
 * caught broadly (FR-007) — some browsers throw on `localStorage` access (notably Safari
 * private browsing) or it may be disabled by policy, and either case is treated the same as
 * "no stored profile" / "save silently did nothing" rather than surfacing an error.
 */
export class GuestProfileStore {
  /**
   * Returns `null` if nothing is stored, storage is unavailable, or the stored blob is
   * structurally invalid (not an object at all) — callers treat that as "first-time visitor"
   * (Story 3's default-name path). A structurally valid blob with an invalid field instead
   * falls back per-field via `guestProfileSchema` (FR-008), still returning a profile.
   */
  load(): GuestProfile | null {
    try {
      const raw = localStorage.getItem(GUEST_PROFILE_STORAGE_KEY)
      if (raw === null) {
        return null
      }

      const result = v.safeParse(guestProfileSchema, JSON.parse(raw))
      return result.success ? result.output : null
    }
    catch {
      return null
    }
  }

  /** Best-effort — a thrown/disabled `localStorage` (FR-007) silently does nothing. */
  save(profile: GuestProfile): void {
    try {
      localStorage.setItem(GUEST_PROFILE_STORAGE_KEY, JSON.stringify(profile))
    }
    catch {
      // Storage unavailable — entry still succeeded, it just won't be remembered next time.
    }
  }
}
