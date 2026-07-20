/**
 * Step 148 — one round of manual adjustment; live preview updates immediately.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatSuggestedSchedule,
  liveSchedulePreview,
} from '../services/baselineDetection.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/baseline-results.tsx'), 'utf8')
const detection = readFileSync(
  join(root, 'services/baselineDetection.ts'),
  'utf8'
)

assert.match(screen, /liveSchedulePreview|baseline-suggested-line/)
assert.match(screen, /baseline-adjust|baseline-adjust-waketime/)
assert.match(screen, /last edit|nudge|Adjust/i)
assert.match(detection, /liveSchedulePreview/)

const seedBed = '04:00'
const seedWake = '12:00'

assert.equal(
  formatSuggestedSchedule(seedBed, seedWake),
  'Sleep 4:00 AM → Wake 12:00 PM'
)
assert.equal(
  liveSchedulePreview(seedBed, seedWake, seedBed, seedWake),
  'Sleep 4:00 AM → Wake 12:00 PM'
)

// Test: nudge wake 12:00 → 11:30 updates preview immediately
assert.equal(
  liveSchedulePreview(seedBed, '11:30', seedBed, seedWake),
  'Sleep 4:00 AM → Wake 11:30 AM'
)

// Partial draft keeps last good wake until HH:MM is valid
assert.equal(
  liveSchedulePreview(seedBed, '11:3', seedBed, seedWake),
  'Sleep 4:00 AM → Wake 12:00 PM'
)

console.log(
  'Baseline adjustment contract OK — 12:00 → 11:30 live preview'
)
