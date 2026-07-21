/**
 * Step 155 — late arrival: lockTime = max(scheduledSleep, arrival + grace).
 * 4:30 arrival → warn at 4:30, lock at 5:00 (not lock at 4:00 while out).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARRIVAL_GRACE_PERIOD_MS,
  computeEffectiveLockTime,
  effectiveLockOccurrenceId,
} from '../services/lateArrivalMath.ts'
import { decidePreLockWarning } from '../services/preLockWarningMath.ts'
import { decideScheduledLock } from '../services/scheduledLockMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lateSrc = readFileSync(join(root, 'services/lateArrivalMath.ts'), 'utf8')
const homeSrc = readFileSync(join(root, 'services/homeArrival.ts'), 'utf8')

assert.match(lateSrc, /lockTime|max\(|homeArrivalTime|gracePeriod/)
assert.match(homeSrc, /recordHomeArrival|arrived|Step 175/)
assert.equal(ARRIVAL_GRACE_PERIOD_MS, 30 * 60 * 1000)

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

const scheduledSleep = '04:00'
const wakeTime = '12:00'

// Still commuting at original 4:00 — do NOT lock
const stillOut = computeEffectiveLockTime({
  now: at(4, 0),
  scheduledSleepHHMM: scheduledSleep,
  homeArrivalTime: null,
})
assert.equal(stillOut.lockAt, null)
assert.equal(stillOut.deferredForLateArrival, true)
assert.equal(
  decideScheduledLock({
    now: at(4, 0),
    sleepTime: scheduledSleep,
    wakeTime,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: null,
  }).shouldEnable,
  false
)

// Arrive 4:30 → lockTime = max(4:00, 4:30+30m) = 5:00
const arrival = at(4, 30)
const late = computeEffectiveLockTime({
  now: at(4, 30),
  scheduledSleepHHMM: scheduledSleep,
  homeArrivalTime: arrival,
})
assert.ok(late.lockAt)
assert.equal(late.lockAt.getHours(), 5)
assert.equal(late.lockAt.getMinutes(), 0)
assert.equal(late.deferredForLateArrival, true)
assert.equal(effectiveLockOccurrenceId(late.lockAt), '2026-07-22T05:00')

// Warning fires at 4:30 (30 min before effective lock), not earlier at 3:30
assert.equal(
  decidePreLockWarning({
    now: at(4, 30),
    sleepTime: scheduledSleep,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: arrival,
    lastWarnedOccurrenceId: null,
  }).shouldFire,
  true
)

// Still must not enable at 4:30 — lock is 5:00
assert.equal(
  decideScheduledLock({
    now: at(4, 30),
    sleepTime: scheduledSleep,
    wakeTime,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: arrival,
  }).shouldEnable,
  false
)

// Lock engages at 5:00
assert.equal(
  decideScheduledLock({
    now: at(5, 0),
    sleepTime: scheduledSleep,
    wakeTime,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: arrival,
  }).shouldEnable,
  true
)

console.log(
  'Late arrival contract OK — 4:30 arrive → warn 4:30 / lock 5:00 (not 4:00)'
)
