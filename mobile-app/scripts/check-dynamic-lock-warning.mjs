/**
 * Step 176 — dynamic lock-warning trigger from real geofence homeArrival.
 * Formula: effectiveLockTime = Math.max(scheduledSleepTime, homeArrivalTime + GRACE_MINUTES)
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  effectiveLockTimeMs,
  GRACE_MINUTES,
  computeEffectiveLockTime,
} from '../services/lateArrivalMath.ts'
import { computeDynamicLockWarningTrigger } from '../services/dynamicLockWarningMath.ts'
import { GEOFENCE_EVENT_ENTER } from '../services/homeGeofenceMath.ts'
import { interpretHomeGeofenceEvent } from '../services/homeGeofenceMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lateSrc = readFileSync(join(root, 'services/lateArrivalMath.ts'), 'utf8')
const dynSrc = readFileSync(
  join(root, 'services/dynamicLockWarningMath.ts'),
  'utf8'
)
const dynIo = readFileSync(join(root, 'services/dynamicLockWarning.ts'), 'utf8')
const warn = readFileSync(join(root, 'services/preLockWarning.ts'), 'utf8')
const geo = readFileSync(join(root, 'services/homeGeofence.ts'), 'utf8')
const home = readFileSync(join(root, 'services/homeArrival.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(GRACE_MINUTES, 30)
assert.match(lateSrc, /effectiveLockTime\s*=\s*Math\.max|Math\.max\(/)
assert.match(lateSrc, /GRACE_MINUTES/)
assert.match(lateSrc, /effectiveLockTimeMs/)
assert.match(dynSrc, /computeDynamicLockWarningTrigger/)
assert.match(dynSrc, /arrivalSource.*geofence|geofence/)
assert.match(dynIo, /loadHomeArrivalTime/)
assert.doesNotMatch(dynIo, /mockHomeArrival|MOCK_ARRIVAL|homeArrivalTime:\s*new Date\(202/)
assert.match(warn, /loadHomeArrivalTime/)
assert.match(geo, /syncHomeArrivalFromGeofenceEnter/)
assert.match(home, /persistHomeArrival|HOME_ARRIVAL_STORAGE/)
assert.match(summary, /Step 176|6\.126.*176|effectiveLockTime/)
assert.ok(pkg.scripts['test:dynamic-lock-warning'])

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

const scheduled = at(4, 0).getTime()
const arrival = at(4, 30).getTime()
const effective = effectiveLockTimeMs(scheduled, arrival, GRACE_MINUTES)
assert.equal(effective, at(5, 0).getTime())
assert.equal(
  effective,
  Math.max(scheduled, arrival + GRACE_MINUTES * 60 * 1000)
)

// Early arrival → max keeps scheduled sleep
assert.equal(
  effectiveLockTimeMs(scheduled, at(3, 0).getTime(), GRACE_MINUTES),
  scheduled
)

// Geofence Enter is what seeds homeArrival (not a mock clock)
const enter = interpretHomeGeofenceEvent(GEOFENCE_EVENT_ENTER)
assert.equal(enter.shouldRecordHomeArrival, true)

const geofenceArrival = at(4, 30)
const trigger = computeDynamicLockWarningTrigger({
  now: at(4, 30),
  scheduledSleepHHMM: '04:00',
  wakeTimeHHMM: '12:00',
  homeArrivalTime: geofenceArrival,
  currentlyLocked: false,
  scheduleLockedIn: true,
  lastWarnedOccurrenceId: null,
})
assert.equal(trigger.arrivalSource, 'geofence')
assert.ok(trigger.effectiveLockTime)
assert.equal(trigger.effectiveLockTime.getHours(), 5)
assert.equal(trigger.effectiveLockTime.getMinutes(), 0)
assert.equal(trigger.shouldWarnNow, true)
assert.ok(trigger.warningTriggerAt)
assert.equal(trigger.warningTriggerAt.getHours(), 4)
assert.equal(trigger.warningTriggerAt.getMinutes(), 30)

const viaCompute = computeEffectiveLockTime({
  now: at(4, 30),
  scheduledSleepHHMM: '04:00',
  wakeTimeHHMM: '12:00',
  homeArrivalTime: geofenceArrival,
})
assert.equal(
  viaCompute.lockAt?.getTime(),
  trigger.effectiveLockTime.getTime()
)

console.log(
  'Dynamic lock-warning OK — Math.max(scheduled, geofenceArrival+GRACE); 4:30→lock 5:00'
)
