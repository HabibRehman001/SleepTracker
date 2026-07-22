/**
 * Step 181 — native Pedometer (hardware step counter) contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isWithinStepTolerance,
  PEDOMETER_STEP_TOLERANCE,
  startOfLocalDay,
} from '../services/pedometerMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pedometer = readFileSync(join(root, 'services/pedometer.ts'), 'utf8')
const math = readFileSync(join(root, 'services/pedometerMath.ts'), 'utf8')
const store = readFileSync(join(root, 'store/pedometerStore.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/live-steps.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const sensors = readFileSync(join(root, 'services/sensors.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(pkg.dependencies['expo-sensors'], 'expo-sensors')
assert.ok(existsSync(join(root, 'services/pedometer.ts')))
assert.ok(existsSync(join(root, 'app/live-steps.tsx')))

assert.match(pedometer, /from ['"]expo-sensors['"]/)
assert.match(pedometer, /Pedometer\.isAvailableAsync/)
assert.match(pedometer, /Pedometer\.watchStepCount/)
assert.match(pedometer, /getStepCountAsync|getTodayStepCount/)
assert.match(pedometer, /getYesterdayStepCount|getHistoricalDaySteps/)
assert.match(math, /PEDOMETER_STEP_TOLERANCE/)
assert.match(store, /liveSteps/)
assert.match(store, /watchLiveStepCount|startWatch/)
assert.match(store, /yesterdaySteps|refreshHistoricalSteps/)
assert.match(screen, /testID=["']live-steps-screen["']/)
assert.match(screen, /testID=["']live-steps-count["']/)
assert.match(screen, /live-steps-yesterday|Refresh today/)
assert.match(screen, /PEDOMETER_PURPOSE|PEDOMETER_STEP_TOLERANCE/)
assert.match(layout, /live-steps/)
assert.match(index, /open-live-steps|\/live-steps/)
assert.match(settings, /settings-open-live-steps|\/live-steps/)
assert.match(sensors, /Pedometer/)
assert.match(summary, /Step 181|6\.130.*181|watchStepCount|Pedometer/)
assert.ok(pkg.scripts['test:pedometer'])
assert.ok(pkg.scripts['test:pedometer-history'])

assert.equal(PEDOMETER_STEP_TOLERANCE, 2)
assert.equal(isWithinStepTolerance(20, 20), true)
assert.equal(isWithinStepTolerance(20, 18), true)
assert.equal(isWithinStepTolerance(20, 22), true)
assert.equal(isWithinStepTolerance(20, 17), false)
assert.equal(isWithinStepTolerance(20, 23), false)

const sod = startOfLocalDay(new Date(2026, 6, 22, 15, 30, 0))
assert.equal(sod.getHours(), 0)
assert.equal(sod.getMinutes(), 0)

// Prefer hardware pedometer API — do not re-derive steps from accel in pedometer.ts
assert.doesNotMatch(pedometer, /Accelerometer|computeMagnitude/)

console.log(
  'Pedometer contract OK — Pedometer.isAvailableAsync + watchStepCount (±2 of known walk)'
)
