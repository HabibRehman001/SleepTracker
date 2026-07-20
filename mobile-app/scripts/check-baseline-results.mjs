/**
 * Step 147 — baseline results screen (“Here's what we found”).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatClock12h,
  formatNightRange,
  formatSuggestedSchedule,
} from '../services/baselineDetection.ts'
import { useBaselineStore } from '../store/baselineStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
assert.ok(existsSync(join(root, 'app/baseline-results.tsx')))
const screen = readFileSync(join(root, 'app/baseline-results.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/baselineStore.ts'), 'utf8')
const detection = readFileSync(
  join(root, 'services/baselineDetection.ts'),
  'utf8'
)

assert.match(screen, /Here.?s what we found|baseline-results-title/)
assert.match(screen, /baseline-night-1|baseline-night-2/)
assert.match(screen, /baseline-suggested|Adjust|baseline-adjust/)
assert.match(screen, /Lock in schedule|baseline-lock-in/)
assert.match(layout, /baseline-results/)
assert.match(index, /baseline-results/)
assert.match(store, /baselineResultsSeen|markBaselineResultsSeen/)
assert.match(detection, /formatSuggestedSchedule|formatClock12h/)

assert.equal(formatClock12h('04:00'), '4:00 AM')
assert.equal(formatClock12h('12:00'), '12:00 PM')
assert.equal(
  formatSuggestedSchedule('04:00', '12:00'),
  'Sleep 4:00 AM → Wake 12:00 PM'
)

const night = formatNightRange(
  new Date(2026, 6, 21, 4, 10).toISOString(),
  new Date(2026, 6, 21, 12, 5).toISOString()
)
assert.match(night.rangeLabel, /AM|PM/)

useBaselineStore.getState().resetBaseline()
useBaselineStore.getState().setDetectedWindows([
  {
    start: new Date(2026, 6, 21, 4, 10),
    end: new Date(2026, 6, 21, 12, 5),
  },
  {
    start: new Date(2026, 6, 22, 3, 55),
    end: new Date(2026, 6, 22, 11, 50),
  },
])
assert.equal(useBaselineStore.getState().baselineReady, true)
assert.equal(useBaselineStore.getState().baselineResultsSeen, false)
useBaselineStore.getState().markBaselineResultsSeen()
assert.equal(useBaselineStore.getState().baselineResultsSeen, true)

console.log(
  'Baseline results contract OK — two nights + suggested schedule + Adjust'
)
