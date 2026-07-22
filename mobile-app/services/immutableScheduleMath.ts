/**
 * Step 193 — immutable-schedule guarantee (attack-path catalog).
 * After lock-in, only Step 151’s 24h change-request may alter times
 * (and only after the delay via promoteDuePending).
 */

export const IMMUTABLE_SCHEDULE_TITLE = 'Immutable schedule'

export const IMMUTABLE_SCHEDULE_GUARANTEE =
  'Once locked, sleep/wake cannot change through any UI path except the 24-hour override request (Settings → Request schedule change).'

/** UI / store paths that must NOT mutate enforced times while locked. */
export const FORBIDDEN_LOCKED_SCHEDULE_MUTATORS = [
  'setSchedule',
  'applyLockedSchedule', // except idempotent same-times re-hydrate
  'clearSchedule',
  'lockIn', // already locked → no-op
] as const

/** The only allowed user-initiated mutation while locked (pending, not instant). */
export const ALLOWED_LOCKED_SCHEDULE_MUTATOR = 'applyPendingChange'

/** Screens that may edit HH:MM via TextInput while locked. */
export const ALLOWED_SCHEDULE_EDIT_SCREENS = [
  'request-schedule-change.tsx',
] as const

/**
 * Screens that historically offered schedule edits — must refuse when lockedIn.
 */
export const SCHEDULE_ATTACK_UI_PATHS = [
  {
    id: 'settings-direct-edit',
    file: 'settings.tsx',
    mustNotHave: ['TextInput', 'onChangeText'],
    mustHave: ['settings-schedule-readonly', 'request-schedule-change'],
  },
  {
    id: 'baseline-adjust-after-lock',
    file: 'baseline-results.tsx',
    mustHave: ['baseline-results-locked', 'lockedIn'],
  },
  {
    id: 'lock-schedule-reentry',
    file: 'lock-schedule.tsx',
    mustHave: ['lock-schedule-already', 'fetchSchedule'],
  },
  {
    id: 'onboarding-finish-seed',
    file: 'onboarding.tsx',
    note: 'setSchedule is no-op when lockedIn (store guard)',
  },
  {
    id: 'manual-sleep-entry',
    file: 'manual-sleep-entry.tsx',
    note: 'Baseline night entry only — must not call scheduleStore setters',
  },
] as const

export type AttackAttemptResult = {
  path: string
  mutated: boolean
  bedtime: string | null
  waketime: string | null
}

export type ImmutableSnapshot = {
  bedtime: string | null
  waketime: string | null
  lockedIn: boolean
}

/**
 * Pure: did enforced core times change? (pending fields ignored)
 */
export function coreScheduleChanged(
  before: ImmutableSnapshot,
  after: ImmutableSnapshot
): boolean {
  return (
    before.bedtime !== after.bedtime ||
    before.waketime !== after.waketime ||
    before.lockedIn !== after.lockedIn
  )
}
