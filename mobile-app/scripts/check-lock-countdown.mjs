/**
 * Step 156 — full-screen pre-lock countdown (schedule-only).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatCountdown,
  shouldShowLockCountdown,
} from '../services/lockCountdownMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/lock-countdown.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')

assert.match(screen, /lock-countdown-screen|lock-countdown-timer/)
assert.match(screen, /formatCountdown|Phone locks soon/)
assert.match(screen, /loadHomeArrivalTime/)
assert.match(index, /lock-countdown|shouldShowLockCountdown/)
assert.match(index, /loadHomeArrivalTime/)
assert.match(layout, /lock-countdown/)

assert.equal(formatCountdown(30 * 60 * 1000), '30:00')
assert.equal(formatCountdown(90 * 1000), '1:30')
assert.equal(formatCountdown(5 * 1000), '0:05')
assert.equal(formatCountdown(0), '0:00')

function at(h, m) {
  return new Date(2026, 6, 22, h, m, 0, 0)
}

const gate = shouldShowLockCountdown({
  now: at(4, 35),
  scheduledSleepHHMM: '05:00',
  wakeTimeHHMM: '12:00',
  scheduleLockedIn: true,
  currentlyLocked: false,
})
assert.equal(gate.show, true)
assert.ok(gate.remainingMs > 0)
assert.ok(gate.remainingMs <= 30 * 60 * 1000)

assert.equal(
  shouldShowLockCountdown({
    now: at(4, 35),
    scheduledSleepHHMM: '05:00',
    wakeTimeHHMM: '12:00',
    scheduleLockedIn: true,
    currentlyLocked: false,
    dismissedThisSession: true,
  }).show,
  false
)

assert.equal(
  shouldShowLockCountdown({
    now: at(3, 0),
    scheduledSleepHHMM: '05:00',
    wakeTimeHHMM: '12:00',
    scheduleLockedIn: true,
    currentlyLocked: false,
  }).show,
  false
)

console.log('Lock countdown contract OK — full-screen timer in warning window')
