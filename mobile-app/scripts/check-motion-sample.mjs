/**
 * Step 141 — MOTION_SAMPLE background task contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  computeMagnitude,
  countLowMagnitudeInWindow,
  isLowMagnitudeStillProxy,
  MOTION_SAMPLE_INTERVAL_SECONDS,
} from '../services/motionSampleMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const sample = readFileSync(join(root, 'services/motionSample.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'services/motionSample.ts')))
assert.ok(existsSync(join(root, 'services/motionSampleMath.ts')))
assert.ok(
  pkg.dependencies['@react-native-async-storage/async-storage'],
  'AsyncStorage for local motion log'
)
assert.ok(pkg.dependencies['expo-task-manager'])
assert.ok(pkg.dependencies['expo-background-fetch'])

assert.match(bg, /MOTION_SAMPLE/)
assert.match(bg, /TaskManager\.defineTask/)
assert.match(bg, /BackgroundFetch\.registerTaskAsync/)
assert.match(bg, /minimumInterval/)
assert.match(bg, /MOTION_SAMPLE_INTERVAL_SECONDS|15\s*\*\s*60/)
assert.match(sample, /storeSample/)
assert.match(sample, /runMotionSampleOnce|getAccelerometerReading|getLastReading/)
assert.match(sample, /computeMagnitude|magnitude/)
assert.match(layout, /backgroundTasks/)
assert.match(index, /registerMotionSampleTask/)

assert.equal(MOTION_SAMPLE_INTERVAL_SECONDS, 15 * 60)

// Still-on-table ≈ gravity 1g on Z → static under 0.15 m/s²
assert.ok(Math.abs(computeMagnitude(0, 0, 1) - 1) < 1e-9)
assert.ok(isLowMagnitudeStillProxy(1.0))
assert.ok(isLowMagnitudeStillProxy(1.01)) // ~0.098 m/s² < 0.15
assert.equal(isLowMagnitudeStillProxy(1.05), false) // ~0.49 m/s² > 0.15

const twoHours = 2 * 60 * 60 * 1000
const now = Date.now()
const samples = Array.from({ length: 8 }, (_, i) => ({
  timestamp: now - (7 - i) * 15 * 60 * 1000,
  magnitude: 0.995 + i * 0.001,
  deviationMs2: 0,
  isStatic: true,
  x: 0,
  y: 0,
  z: 1,
}))
assert.equal(countLowMagnitudeInWindow(samples, twoHours, now), 8)

console.log(
  'Motion sample contract OK — MOTION_SAMPLE every 15m + local log (~8 / 2h still)'
)
