/**
 * Step 197 — permanent MOTION_SAMPLE + nightly static windows forever.
 * A week after schedule lock, the continuous night log still has one window/night.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CONTINUOUS_DETECTION_POLICY,
  countNightsInRange,
  decideContinuousNightRecord,
  simulateWeekOfContinuousNights,
} from '../services/continuousDetectionMath.ts'
import { MOTION_SAMPLE_LOG_MAX } from '../services/motionSampleMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const math = readFileSync(
  join(root, 'services/continuousDetectionMath.ts'),
  'utf8'
)
const io = readFileSync(join(root, 'services/continuousDetection.ts'), 'utf8')
const sampleMath = readFileSync(
  join(root, 'services/motionSampleMath.ts'),
  'utf8'
)
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(bg, /MOTION_SAMPLE_IS_PERMANENT/)
assert.match(bg, /unregister ignored|unregisterMotionSampleTask/)
assert.match(bg, /runContinuousDetectionOnce/)
assert.match(math, /decideContinuousNightRecord|simulateWeekOfContinuousNights/)
assert.match(io, /runContinuousDetectionOnce|CONTINUOUS_NIGHTS_STORAGE_KEY/)
assert.match(io, /pushPassiveOngoingSession|PASSIVE_SESSION/)
assert.match(CONTINUOUS_DETECTION_POLICY, /forever|never unregistered/i)
assert.match(index, /registerMotionSampleTask/)
assert.doesNotMatch(index, /unregisterMotionSampleTask/)
assert.match(summary, /Step 197|6\.143.*197|continuous|permanent/)
assert.ok(pkg.scripts['test:continuous-detection'])
assert.ok(MOTION_SAMPLE_LOG_MAX >= 672, 'log must hold ≥1 week of 15m samples')
assert.match(sampleMath, /MOTION_SAMPLE_LOG_MAX\s*=\s*1000/)

// Unregister must be a no-op while permanent
assert.match(
  bg,
  /if \(MOTION_SAMPLE_IS_PERMANENT\)[\s\S]*return/
)

// Week after lock: 7 nights each leave a detected static window
const weekStart = new Date(2026, 6, 20, 0, 0, 0, 0) // Jul 20
const { records, samples } = simulateWeekOfContinuousNights({
  startDay: weekStart,
  nights: 7,
  bedHour: 4,
  wakeHour: 12,
})
assert.ok(samples.length > 100)
assert.equal(records.length, 7, `expected 7 nights, got ${records.length}`)
assert.equal(
  countNightsInRange(records, '2026-07-20', '2026-07-26'),
  7
)
const keys = new Set(records.map((r) => r.sleepDayKey))
assert.equal(keys.size, 7)

// Already-logged night is not duplicated
const again = decideContinuousNightRecord({
  samples,
  existingSleepDayKeys: records.map((r) => r.sleepDayKey),
  now: new Date(2026, 6, 27, 14, 0, 0, 0),
})
assert.equal(again, null)

console.log(
  'Continuous detection OK — MOTION_SAMPLE permanent; 7/7 nightly static windows after lock'
)
