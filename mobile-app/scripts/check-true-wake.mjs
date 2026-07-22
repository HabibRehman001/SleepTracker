/**
 * Step 200 — false wake filter: glance-then-sleep ≠ true wake.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { synthesizeSamples } from '../services/staticWindow.ts'
import {
  findTrueWakeEvent,
  hasSustainedActivityAfter,
  TRUE_WAKE_SUSTAINED_ACTIVITY_MS,
} from '../services/trueWakeMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(join(root, 'services/trueWakeMath.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(mathSrc, /function findTrueWakeEvent/)
assert.match(mathSrc, /sustained|20/)
assert.match(summary, /Step 200|6\.146.*200|false wake|true wake/)
assert.ok(pkg.scripts['test:true-wake'])
assert.equal(TRUE_WAKE_SUSTAINED_ACTIVITY_MS, 20 * 60 * 1000)

// Synthetic night (UTC): static sleep, false glance at 06:10, real wake 11:55.
const day = Date.UTC(2026, 6, 22) // July 22
const at = (h, m) => day + h * 3600_000 + m * 60_000
const interval = 15 * 60 * 1000

const sleepStart = at(0, 0) // continuing overnight stillness from prior evening
const falseUnlock = at(6, 10)
const trueUnlock = at(11, 55)
const staticWindowEnd = new Date(trueUnlock)

// Still through just before 11:55 (includes 15+ min stillness after 6:10 glance).
const stillSamples = synthesizeSamples(
  sleepStart,
  trueUnlock - interval,
  interval,
  true,
  { insideHomeGeofence: true }
)
// Sustained activity after real unlock (≥20 min of non-static).
const activeSamples = synthesizeSamples(
  trueUnlock,
  trueUnlock + 45 * 60 * 1000,
  interval,
  false,
  { insideHomeGeofence: true }
)
const samples = [...stillSamples, ...activeSamples]

const unlockEvents = [new Date(falseUnlock), new Date(trueUnlock)]

assert.equal(
  hasSustainedActivityAfter(falseUnlock, samples),
  false,
  '6:10 unlock + stillness must not count as sustained activity'
)
assert.equal(
  hasSustainedActivityAfter(trueUnlock, samples),
  true,
  '11:55 unlock + activity must count as sustained'
)

const wake = findTrueWakeEvent(unlockEvents, staticWindowEnd, samples)
assert.ok(wake, 'expected a true wake event')
assert.equal(
  wake.getTime(),
  trueUnlock,
  'must report 11:55 AM, not 6:10 AM false glance'
)
assert.notEqual(wake.getTime(), falseUnlock)

// Only the false unlock → no true wake (do not invent)
const onlyFalse = findTrueWakeEvent(
  [new Date(falseUnlock)],
  staticWindowEnd,
  samples
)
assert.equal(onlyFalse, null)

console.log(
  'True wake OK — 6:10 glance rejected; 11:55 unlock+activity selected'
)
