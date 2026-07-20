/**
 * Step 145 — 2-night baseline average → baselineStore.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  averageBedWakeFromWindows,
  averageClockTimes,
  BASELINE_TARGET_NIGHTS,
  clockToMinutes,
  formatHHMM,
} from '../services/baselineDetection.ts'
import { useBaselineStore } from '../store/baselineStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const detection = readFileSync(join(root, 'services/baselineDetection.ts'), 'utf8')
const store = readFileSync(join(root, 'store/baselineStore.ts'), 'utf8')

assert.match(detection, /BASELINE_TARGET_NIGHTS|averageBedWakeFromWindows/)
assert.match(store, /addDetectedWindow|detectedWindows|baselineReady/)
assert.equal(BASELINE_TARGET_NIGHTS, 2)

// Build local Dates for the synthetic nights (hour/minute only matter for HH:MM)
function localAt(h, m) {
  const d = new Date(2026, 6, 21, h, m, 0, 0)
  return d
}

const night1 = {
  start: localAt(4, 10),
  end: localAt(12, 5),
}
const night2 = {
  start: localAt(3, 55),
  end: localAt(11, 50),
}

assert.equal(formatHHMM(night1.start), '04:10')
assert.equal(formatHHMM(night1.end), '12:05')
assert.equal(formatHHMM(night2.start), '03:55')
assert.equal(formatHHMM(night2.end), '11:50')

const avg = averageBedWakeFromWindows([night1, night2])
assert.ok(avg)
assert.equal(avg.detectedBedtime, '04:02')
assert.equal(avg.detectedWaketime, '11:57')
assert.equal(avg.sampleNights, 2)

// Spot-check minute math: (250+235)/2 = 242.5 → 04:02; (725+710)/2 = 717.5 → 11:57
assert.equal(clockToMinutes('04:10'), 250)
assert.equal(clockToMinutes('03:55'), 235)
assert.equal(averageClockTimes(['04:10', '03:55']), '04:02')
assert.equal(averageClockTimes(['12:05', '11:50']), '11:57')

// One night alone → no finalized average
assert.equal(averageBedWakeFromWindows([night1]), null)

// Store persistence path
useBaselineStore.getState().resetBaseline()
useBaselineStore.getState().addDetectedWindow(night1)
assert.equal(useBaselineStore.getState().baselineReady, false)
assert.equal(useBaselineStore.getState().detectedWindows.length, 1)

useBaselineStore.getState().addDetectedWindow(night2)
assert.equal(useBaselineStore.getState().baselineReady, true)
assert.equal(useBaselineStore.getState().sampleNights, 2)
assert.equal(useBaselineStore.getState().detectedBedtime, '04:02')
assert.equal(useBaselineStore.getState().detectedWaketime, '11:57')
assert.equal(useBaselineStore.getState().detectedWindows.length, 2)

useBaselineStore.getState().resetBaseline()
useBaselineStore.getState().setDetectedWindows([night1, night2])
assert.equal(useBaselineStore.getState().detectedBedtime, '04:02')
assert.equal(useBaselineStore.getState().detectedWaketime, '11:57')

console.log(
  'Baseline 2-night contract OK — 04:10–12:05 + 03:55–11:50 → 04:02–11:57'
)
