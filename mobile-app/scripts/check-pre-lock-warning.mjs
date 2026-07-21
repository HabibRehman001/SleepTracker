/**
 * Step 154 — pre-lock warning (with home arrival for effective lockTime).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LOCK_WARNING_MINUTES,
  PRE_LOCK_WARNING_BODY,
  decidePreLockWarning,
  minutesUntilSleep,
  runPreLockWarningOnce,
} from '../services/preLockWarningMath.ts'
import { effectiveLockOccurrenceId } from '../services/lateArrivalMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const warn = readFileSync(join(root, 'services/preLockWarning.ts'), 'utf8')
const math = readFileSync(join(root, 'services/preLockWarningMath.ts'), 'utf8')
const notifications = readFileSync(
  join(root, 'services/notifications.ts'),
  'utf8'
)

assert.equal(LOCK_WARNING_MINUTES, 30)
assert.equal(PRE_LOCK_WARNING_BODY, 'Phone locks in 30 minutes')
assert.match(math, /decidePreLockWarning|already-warned/)
assert.match(warn, /runPreLockWarningOnce|PRE_LOCK_WARNED/)
assert.match(bg, /runPreLockWarningOnce/)
assert.match(notifications, /PRE_LOCK_WARNING_BODY|Phone locks in 30 minutes/)

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

// On-time: arrive 4:00, sleep 5:00 → lock 5:00, warn at 4:30
assert.equal(minutesUntilSleep(at(4, 30), '05:00'), 30)

const homeArrival = at(4, 0)
const base = {
  now: at(4, 30),
  sleepTime: '05:00',
  currentlyLocked: false,
  scheduleLockedIn: true,
  homeArrivalTime: homeArrival,
  lastWarnedOccurrenceId: null,
}

assert.equal(decidePreLockWarning(base).shouldFire, true)
assert.equal(
  decidePreLockWarning({ ...base, now: at(4, 0) }).shouldFire,
  false
)
assert.equal(
  decidePreLockWarning({ ...base, currentlyLocked: true }).shouldFire,
  false
)

const occurrenceId = effectiveLockOccurrenceId(at(5, 0))
assert.equal(
  decidePreLockWarning({
    ...base,
    now: at(4, 45),
    lastWarnedOccurrenceId: occurrenceId,
  }).shouldFire,
  false
)

let presentCalls = 0
let savedId = null
const schedule = { sleepTime: '05:00', lockedIn: true }

const first = await runPreLockWarningOnce(at(4, 30), {
  loadSchedule: async () => schedule,
  isLocked: async () => false,
  loadHomeArrival: async () => homeArrival,
  loadLastWarnedId: async () => savedId,
  saveLastWarnedId: async (id) => {
    savedId = id
  },
  presentWarning: async (body) => {
    assert.equal(body, 'Phone locks in 30 minutes')
    presentCalls += 1
  },
})
assert.equal(first.fired, true)
assert.equal(presentCalls, 1)

const second = await runPreLockWarningOnce(at(4, 40), {
  loadSchedule: async () => schedule,
  isLocked: async () => false,
  loadHomeArrival: async () => homeArrival,
  loadLastWarnedId: async () => savedId,
  saveLastWarnedId: async (id) => {
    savedId = id
  },
  presentWarning: async () => {
    presentCalls += 1
  },
})
assert.equal(second.fired, false)
assert.equal(presentCalls, 1)

console.log(
  'Pre-lock warning contract OK — arrive T-30 fires exactly one notification'
)
