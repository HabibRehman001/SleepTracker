/**
 * Step 152–153 / 155 — SCHEDULED_LOCK with late-arrival awareness.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decideScheduledLock,
  isInSleepWindow,
  runScheduledLockOnce,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
} from '../services/scheduledLockMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const lock = readFileSync(join(root, 'services/scheduledLock.ts'), 'utf8')
const math = readFileSync(join(root, 'services/scheduledLockMath.ts'), 'utf8')

assert.match(bg, /SCHEDULED_LOCK/)
assert.match(bg, /disableLock\(\)|result\.disabled/)
assert.match(lock, /disableLock/)
assert.match(lock, /loadHomeArrivalTime/)
assert.match(math, /shouldDisable/)

assert.equal(SCHEDULED_LOCK_INTERVAL_SECONDS, 15 * 60)

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

const earlyArrival = at(3, 30)

assert.equal(isInSleepWindow(at(4, 0), '04:00', '12:00'), true)
assert.equal(isInSleepWindow(at(12, 0), '04:00', '12:00'), false)

assert.equal(
  decideScheduledLock({
    now: at(4, 0),
    sleepTime: '04:00',
    wakeTime: '12:00',
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: earlyArrival,
  }).shouldEnable,
  true
)

assert.equal(
  decideScheduledLock({
    now: at(4, 0),
    sleepTime: '04:00',
    wakeTime: '12:00',
    currentlyLocked: false,
    scheduleLockedIn: true,
    homeArrivalTime: null,
  }).shouldEnable,
  false
)

assert.equal(
  decideScheduledLock({
    now: at(12, 0),
    sleepTime: '04:00',
    wakeTime: '12:00',
    currentlyLocked: true,
    scheduleLockedIn: true,
    homeArrivalTime: earlyArrival,
  }).shouldDisable,
  true
)

let enableCalls = 0
let disableCalls = 0
const schedule = {
  sleepTime: '04:00',
  wakeTime: '12:00',
  lockedIn: true,
}

const locked = await runScheduledLockOnce(at(4, 5), {
  enableLock: async () => {
    enableCalls += 1
  },
  disableLock: async () => {
    disableCalls += 1
  },
  isLocked: async () => false,
  loadSchedule: async () => schedule,
  loadHomeArrival: async () => earlyArrival,
})
assert.equal(locked.enabled, true)
assert.equal(locked.disabled, false)
assert.equal(enableCalls, 1)

const unlocked = await runScheduledLockOnce(at(12, 1), {
  enableLock: async () => {
    enableCalls += 1
  },
  disableLock: async () => {
    disableCalls += 1
  },
  isLocked: async () => true,
  loadSchedule: async () => schedule,
  loadHomeArrival: async () => earlyArrival,
})
assert.equal(unlocked.enabled, false)
assert.equal(unlocked.disabled, true)
assert.equal(disableCalls, 1)

console.log(
  'Scheduled lock/unlock contract OK — past wakeTime → disableLock()'
)
