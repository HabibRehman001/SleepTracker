/**
 * Step 155 / 175 — late arrival: lockTime = max(scheduledSleep, arrival + 30m).
 * Still out → no lock; 4:30 arrival → warn 4:30 / lock 5:00.
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

assert.match(lateSrc, /max\(|arrivalBasedLockAt|ARRIVAL_GRACE|GRACE_MINUTES|effectiveLockTimeMs/)
assert.equal(ARRIVAL_GRACE_PERIOD_MS, 30 * 60 * 1000)

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

const scheduledSleep = '04:00'
const wakeTime = '12:00'

// Still commuting at scheduled sleep → do not lock
const stillOut = computeEffectiveLockTime({
  now: at(4, 0),
  scheduledSleepHHMM: scheduledSleep,
  wakeTimeHHMM: wakeTime,
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

// On-time: arrived ≥30m before sleep → lock at scheduled 4:00
const early = at(3, 30)
const onTime = computeEffectiveLockTime({
  now: at(4, 0),
  scheduledSleepHHMM: scheduledSleep,
  wakeTimeHHMM: wakeTime,
  homeArrivalTime: early,
})
assert.ok(onTime.lockAt)
assert.equal(onTime.lockAt.getHours(), 4)
assert.equal(onTime.lockAt.getMinutes(), 0)
assert.equal(onTime.deferredForLateArrival, false)

// Late arrival 4:30 → lock at 5:00 (arrival + 30m), not 4:00
const arrival = at(4, 30)
const late = computeEffectiveLockTime({
  now: at(4, 30),
  scheduledSleepHHMM: scheduledSleep,
  wakeTimeHHMM: wakeTime,
  homeArrivalTime: arrival,
})
assert.ok(late.lockAt)
assert.equal(late.lockAt.getHours(), 5)
assert.equal(late.lockAt.getMinutes(), 0)
assert.equal(late.deferredForLateArrival, true)
assert.equal(effectiveLockOccurrenceId(late.lockAt), '2026-07-22T05:00')

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

// Warning at arrival (4:30) for lock at 5:00 — not while still out at 3:30
assert.equal(
  decidePreLockWarning({
    now: at(3, 30),
    sleepTime: scheduledSleep,
    wakeTime,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: null,
    lastWarnedOccurrenceId: null,
  }).shouldFire,
  true // T-30 of scheduled sleep while still before sleep (lockAt = 4:00)
)
assert.equal(
  decidePreLockWarning({
    now: at(4, 30),
    sleepTime: scheduledSleep,
    wakeTime,
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: arrival,
    lastWarnedOccurrenceId: null,
  }).shouldFire,
  true
)

console.log(
  'Late arrival OK — 4:30 home → warn 4:30 / lock 5:00; still out skips lock'
)
