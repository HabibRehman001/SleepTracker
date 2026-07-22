/**
 * Step 177 — never arrived home: skip-lock policy (away all night).
 * Policy is documented in Settings; simulated away overnight must not lock.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateNeverArrivedNight,
  NEVER_ARRIVED_HOME_POLICY,
  NEVER_ARRIVED_POLICY_BODY,
  NEVER_ARRIVED_POLICY_SHORT,
  NEVER_ARRIVED_POLICY_TITLE,
  shouldSkipLockForNeverArrived,
} from '../services/neverArrivedPolicyMath.ts'
import {
  decideScheduledLock,
  runScheduledLockOnce,
} from '../services/scheduledLockMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const policySrc = readFileSync(
  join(root, 'services/neverArrivedPolicyMath.ts'),
  'utf8'
)
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const lockMath = readFileSync(
  join(root, 'services/scheduledLockMath.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(NEVER_ARRIVED_HOME_POLICY, 'skip-lock')
assert.match(policySrc, /skip-lock/)
assert.match(policySrc, /NEVER_ARRIVED_POLICY_BODY/)
assert.match(settings, /settings-never-arrived-policy/)
assert.match(settings, /NEVER_ARRIVED_POLICY_BODY/)
assert.match(index, /home-never-arrived-hint|NEVER_ARRIVED_POLICY_SHORT/)
assert.match(lockMath, /evaluateNeverArrivedNight|never-arrived|skip-lock/)
assert.match(summary, /Step 177|6\.127.*177|skip-lock|never arrived/)
assert.ok(pkg.scripts['test:never-arrived'])
assert.ok(NEVER_ARRIVED_POLICY_TITLE.length > 0)
assert.ok(NEVER_ARRIVED_POLICY_BODY.includes('skips locking'))
assert.ok(NEVER_ARRIVED_POLICY_SHORT.includes('skip lock'))

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

const sleep = '04:00'
const wake = '12:00'

// --- Simulated away all night: no geofence Enter ---
assert.equal(shouldSkipLockForNeverArrived(null), true)
assert.equal(shouldSkipLockForNeverArrived(at(4, 30)), false)

const midNight = evaluateNeverArrivedNight({
  now: at(5, 0),
  sleepTime: sleep,
  wakeTime: wake,
  homeArrivalTime: null,
})
assert.equal(midNight.status, 'awaiting-home')
assert.equal(midNight.shouldEnableLock, false)
assert.equal(midNight.policy, 'skip-lock')
assert.equal(midNight.skippedReason, 'awaiting-home-geofence')

const morning = evaluateNeverArrivedNight({
  now: at(12, 30),
  sleepTime: sleep,
  wakeTime: wake,
  homeArrivalTime: null,
})
assert.equal(morning.status, 'skipped-away-all-night')
assert.equal(morning.shouldEnableLock, false)
assert.equal(morning.skippedReason, 'never-arrived-skip-lock')

// Must not lock at scheduled sleep, mid-window, or past wake when away
for (const now of [at(4, 0), at(5, 0), at(8, 0), at(12, 0), at(12, 30)]) {
  const d = decideScheduledLock({
    now,
    sleepTime: sleep,
    wakeTime: wake,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: null,
  })
  assert.equal(
    d.shouldEnable,
    false,
    `away @ ${now.getHours()}:${now.getMinutes()} must not enable lock`
  )
  assert.equal(d.effectiveLockAt, null)
}

let enableCalls = 0
const awayRun = await runScheduledLockOnce(at(5, 0), {
  enableLock: async () => {
    enableCalls += 1
  },
  disableLock: async () => {},
  isLocked: async () => false,
  loadSchedule: async () => ({
    sleepTime: sleep,
    wakeTime: wake,
    lockedIn: true,
  }),
  loadHomeArrival: async () => null,
})
assert.equal(awayRun.enabled, false)
assert.equal(enableCalls, 0)
assert.equal(awayRun.awayStatus, 'awaiting-home')
assert.match(awayRun.skippedReason ?? '', /awaiting-home|never-arrived|deferred/)

const skippedNight = await runScheduledLockOnce(at(13, 0), {
  enableLock: async () => {
    enableCalls += 1
  },
  disableLock: async () => {},
  isLocked: async () => false,
  loadSchedule: async () => ({
    sleepTime: sleep,
    wakeTime: wake,
    lockedIn: true,
  }),
  loadHomeArrival: async () => null,
})
assert.equal(skippedNight.enabled, false)
assert.equal(skippedNight.awayStatus, 'skipped-away-all-night')
assert.equal(enableCalls, 0)

// Contrast: arrived home → lock can enable at effective time
const arrived = decideScheduledLock({
  now: at(5, 0),
  sleepTime: sleep,
  wakeTime: wake,
  currentlyLocked: false,
  scheduleLockedIn: true,
  homeArrivalTime: at(4, 30),
})
assert.equal(arrived.shouldEnable, true)
assert.equal(arrived.awayStatus, 'arrived')

console.log(
  'Never-arrived policy OK — skip-lock; away all night never enables (documented in Settings)'
)
