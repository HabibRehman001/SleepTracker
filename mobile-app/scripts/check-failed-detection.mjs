/**
 * Step 146 — failed detection night → manual entry prompt (no silent guess).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateNightDetection,
  FAILED_DETECTION_PROMPT,
  MIN_VALID_DETECTION_MS,
} from '../services/nightDetection.ts'
import { synthesizeSamples } from '../services/staticWindow.ts'
import { useBaselineStore } from '../store/baselineStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nightSrc = readFileSync(join(root, 'services/nightDetection.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/manual-sleep-entry.tsx'), 'utf8')
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/baselineStore.ts'), 'utf8')

assert.match(nightSrc, /MIN_VALID_DETECTION_MS|evaluateNightDetection/)
assert.match(nightSrc, /couldn't detect last night's sleep/i)
assert.equal(MIN_VALID_DETECTION_MS, 5 * 60 * 60 * 1000)
assert.match(screen, /manual-sleep-entry-screen|failed-detection-prompt/)
assert.match(screen, /manual-bedtime|manual-waketime/)
assert.match(home, /failed-detection-banner|manual-sleep-entry/)
assert.match(store, /processNightSamples|pendingManualEntry|submitManualNight/)
assert.equal(
  FAILED_DETECTION_PROMPT,
  "We couldn't detect last night's sleep — want to enter it manually?"
)

const day = new Date(2026, 6, 20)
function at(h, m, dayOffset = 0) {
  const d = new Date(day)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

const interval = 15 * 60 * 1000

// Fragmented short static windows overnight (TV / naps) — all under 5h
const frag1 = synthesizeSamples(at(23, 0), at(23, 45), interval, true, {
  insideHomeGeofence: true,
})
const frag2 = synthesizeSamples(at(2, 0, 1), at(3, 30, 1), interval, true, {
  insideHomeGeofence: true,
})
const frag3 = synthesizeSamples(at(5, 0, 1), at(6, 0, 1), interval, true, {
  insideHomeGeofence: true,
})
const active = synthesizeSamples(at(22, 0), at(22, 45), interval, false, {
  insideHomeGeofence: true,
})

const fragmented = [...active, ...frag1, ...frag2, ...frag3]
const result = evaluateNightDetection(fragmented)
assert.equal(result.status, 'failed')
assert.equal(result.shouldPromptManualEntry, true)
assert.ok(result.longestStaticMs < MIN_VALID_DETECTION_MS)

// Store: failed night does not append a guessed window
useBaselineStore.getState().resetBaseline()
const outcome = useBaselineStore.getState().processNightSamples(fragmented)
assert.equal(outcome, 'failed')
assert.equal(useBaselineStore.getState().pendingManualEntry, true)
assert.equal(
  useBaselineStore.getState().lastDetectionPrompt,
  FAILED_DETECTION_PROMPT
)
assert.equal(useBaselineStore.getState().detectedWindows.length, 0)
assert.equal(useBaselineStore.getState().baselineReady, false)

// Manual entry adds a real window without corrupting from the failed night
useBaselineStore.getState().submitManualNight('04:10', '12:05')
assert.equal(useBaselineStore.getState().pendingManualEntry, false)
assert.equal(useBaselineStore.getState().detectedWindows.length, 1)
assert.equal(useBaselineStore.getState().detectedBedtime, null) // need 2 nights
assert.equal(useBaselineStore.getState().sampleNights, 1)

// Clean long night still succeeds automatically
const clean = synthesizeSamples(at(4, 15, 1), at(12, 20, 1), interval, true, {
  insideHomeGeofence: true,
})
useBaselineStore.getState().resetBaseline()
assert.equal(useBaselineStore.getState().processNightSamples(clean), 'ok')
assert.equal(useBaselineStore.getState().pendingManualEntry, false)
assert.equal(useBaselineStore.getState().detectedWindows.length, 1)

console.log(
  'Failed detection contract OK — fragmented night prompts manual entry; no silent guess'
)
