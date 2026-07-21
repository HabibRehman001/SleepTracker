/**
 * Step 153 — past wakeTime unlocks automatically (same SCHEDULED_LOCK task).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decideScheduledLock,
  runScheduledLockOnce,
} from '../services/scheduledLockMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const lock = readFileSync(join(root, 'services/scheduledLock.ts'), 'utf8')

assert.match(bg, /disableLock|result\.disabled/)
assert.match(lock, /disableLock/)

function at(h, m) {
  return new Date(2026, 6, 22, h, m, 0, 0)
}

const earlyArrival = at(3, 0)

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

let disableCalls = 0
const result = await runScheduledLockOnce(at(12, 5), {
  enableLock: async () => {},
  disableLock: async () => {
    disableCalls += 1
  },
  isLocked: async () => true,
  loadSchedule: async () => ({
    sleepTime: '04:00',
    wakeTime: '12:00',
    lockedIn: true,
  }),
  loadHomeArrival: async () => earlyArrival,
})
assert.equal(result.disabled, true)
assert.equal(result.enabled, false)
assert.equal(disableCalls, 1)

console.log(
  'Scheduled unlock contract OK — past wakeTime unlocks without user action'
)
