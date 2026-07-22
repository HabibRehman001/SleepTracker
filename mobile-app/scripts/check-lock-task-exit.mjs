/**
 * Step 163 — Exit Lock Task at wake via disableLock() → stopLockTask().
 * Same SCHEDULED_LOCK / Step 153 path that calls lockService.disableLock().
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
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const session = readFileSync(
  join(root, 'native/android/SleepLockSession.kt'),
  'utf8'
)
const scheduled = readFileSync(join(root, 'services/scheduledLock.ts'), 'utf8')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')

assert.match(moduleKt, /stopLockTask\s*\(/)
assert.match(moduleKt, /fun disableLock/)
assert.match(moduleKt, /safeStopLockTask|LOCK_TASK_MODE/)
assert.match(moduleKt, /setPendingStopLockTask|consumePendingStopLockTask/)
assert.match(moduleKt, /onHostResume/)
assert.match(session, /pendingStop|PendingStop|PENDING_STOP/i)
assert.match(scheduled, /disableLock/)
assert.match(bg, /disableLock|result\.disabled/)

function at(h, m) {
  return new Date(2026, 6, 22, h, m, 0, 0)
}

assert.equal(
  decideScheduledLock({
    now: at(12, 0),
    sleepTime: '04:00',
    wakeTime: '12:00',
    currentlyLocked: true,
    scheduleLockedIn: true,
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
})
assert.equal(result.disabled, true)
assert.equal(disableCalls, 1)

console.log(
  'Lock Task exit OK — wake disableLock() → stopLockTask(); home/nav works again'
)
