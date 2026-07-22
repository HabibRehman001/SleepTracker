/**
 * Step 195 — app store / distribution policy realities (decide before Step 196 polish).
 *
 * Google Play Device Owner / Lock Task / call-restriction APIs are aimed at
 * enterprise & kiosk MDM, not a normal consumer “install from Play and hard-lock
 * your phone” listing. Personal Device Owner via ADB is a sideload model.
 */

/** Explicit product decision for this repo (Step 195). */
export const DISTRIBUTION_MODEL = 'personal-sideload' as const

export type DistributionModel = typeof DISTRIBUTION_MODEL | 'play-soft-lock-only'

export const DISTRIBUTION_DECISION_SUMMARY =
  'Sleep Lock’s full Android lock (Device Owner → Lock Task, outgoing-call block) is a personal/sideloaded build: ADB enroll on your own phone. It is not positioned for a standard Google Play consumer listing that claims “locks your phone / blocks calls.” Soft-lock (stats, schedule, countdown, calm lock screen) may be store-eligible later only with careful wording that does not promise Device Owner / call-block / hard kiosk.'

export const DISTRIBUTION_RATIONALE = [
  'Play’s Device Owner / device-policy APIs target enterprise and dedicated-device (kiosk) use — not one-tap consumer enrollment.',
  'Personal Device Owner requires factory-reset + ADB `dpm set-device-owner` — realistically sideload / power-user, not Play install.',
  'Listing copy that says “locks your phone” or “blocks calls” without Device Owner is inaccurate; with Device Owner it conflicts with typical Play personal-device expectations.',
  'iOS cannot match Android call-block / hard kiosk (Step 114) — store copy must stay soft-lock honest.',
] as const

/** Claims that must NOT appear in a hypothetical Play/App Store soft-lock listing. */
export const STORE_FORBIDDEN_CLAIMS = [
  'locks your phone',
  'blocks calls',
  'blocks outgoing calls',
  'kiosk mode',
  'device owner',
  'cannot exit the app',
  'disables the home button',
] as const

/** Accurate claims allowed for soft-lock / store-oriented wording. */
export const STORE_ALLOWED_SOFT_LOCK_CLAIMS = [
  'sleep schedule reminders',
  'pre-lock countdown',
  'calm sleep lock screen',
  'stats-driven soft lock',
  'home arrival–aware timing',
] as const

/** Claims reserved for sideloaded Device Owner builds (honest power-user docs). */
export const SIDELOAD_FULL_LOCK_CLAIMS = [
  'Lock Task / kiosk while Device Owner is enrolled',
  'outgoing call restriction while locked (Device Owner)',
  'requires one-time ADB Device Owner setup — not a Play Store install path',
] as const

export const DISTRIBUTION_IMPLICATIONS_FOR_STEP_196 = [
  'Polish soft-lock UX, copy accuracy, and reliability (Steps 191–194) for daily use.',
  'Do not invest in Play Store screenshots/listing that advertise hard lock or call blocking.',
  'Keep Device Owner setup as an optional advanced path with sideload/ADB wording.',
  'If a future soft-lock-only store build is desired, fork listing copy from STORE_ALLOWED_SOFT_LOCK_CLAIMS only.',
] as const

export const DEVICE_OWNER_DISTRIBUTION_NOTE =
  'Full lock is a personal sideload path (ADB Device Owner). It is not distributed as a normal Play Store “locks your phone / blocks calls” consumer app.'

/**
 * Pure guard: reject store listing body text that over-promises full lock.
 * Case-insensitive substring match against STORE_FORBIDDEN_CLAIMS.
 */
export function assertStoreListingCopyIsSoftLockSafe(listingBody: string): {
  ok: boolean
  violations: string[]
} {
  const lower = listingBody.toLowerCase()
  const violations = STORE_FORBIDDEN_CLAIMS.filter((claim) =>
    lower.includes(claim.toLowerCase())
  )
  return { ok: violations.length === 0, violations }
}

export function isPersonalSideloadModel(
  model: string = DISTRIBUTION_MODEL
): boolean {
  return model === 'personal-sideload'
}
