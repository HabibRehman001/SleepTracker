/**
 * Step 188 — weighted improvement verdict + bedtime adherence (±15 min).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  bedtimeAdherencePercent,
  BEDTIME_ADHERENCE_WINDOW_MIN,
  computeImprovementVerdict,
  isNightWithinScheduledBedtime,
  IMPROVEMENT_WEIGHTS,
} from '../src/services/improvementVerdictMath.ts'
import {
  buildVerdictFromDeltas,
  computeDeltas,
  didImprove,
  emptyMonthStats,
} from '../src/services/comparison.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(
  join(root, 'src/services/improvementVerdictMath.ts'),
  'utf8'
)
const comparison = readFileSync(
  join(root, 'src/services/comparison.service.ts'),
  'utf8'
)
const monthly = readFileSync(
  join(root, 'src/services/monthlyStats.service.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(BEDTIME_ADHERENCE_WINDOW_MIN, 15)
assert.equal(IMPROVEMENT_WEIGHTS.bedtimeAdherence, 0.45)
assert.match(math, /computeImprovementVerdict|isNightWithinScheduledBedtime/)
assert.match(comparison, /bedtimeAdherencePercent|buildVerdictFromDeltas|verdict/)
assert.match(monthly, /bedtimeAdherencePercent|isNightWithinScheduledBedtime/)
assert.match(summary, /Step 188|6\.136.*188|bedtime adherence|Improved/)
assert.ok(pkg.scripts['test:improvement-verdict'])

// ±15 min window around 23:00
assert.equal(isNightWithinScheduledBedtime(23 * 60, 23 * 60), true)
assert.equal(isNightWithinScheduledBedtime(23 * 60 + 15, 23 * 60), true)
assert.equal(isNightWithinScheduledBedtime(23 * 60 + 16, 23 * 60), false)
assert.equal(isNightWithinScheduledBedtime(22 * 60 + 45, 23 * 60), true)
assert.equal(bedtimeAdherencePercent(3, 5), 60)

// Tighter bedtime adherence vs prior month → Improved, driven by adherence
// (even if duration dipped slightly)
const verdict = computeImprovementVerdict({
  durationDelta: -10,
  adherenceDelta: 40,
  stepsDelta: 0,
})
assert.equal(verdict.improved, true)
assert.equal(verdict.driver, 'bedtimeAdherence')
assert.match(verdict.reason, /Improved/)
assert.match(verdict.reason, /bedtime adherence/i)

// Wire through comparison helpers with month stats
const last = {
  ...emptyMonthStats('2026-06'),
  sessionCount: 5,
  avgDurationMinutes: 420,
  bedtimeAdherencePercent: 40,
  avgStepsCount: 5000,
  consistencyScore: 50,
}
const tighter = {
  ...emptyMonthStats('2026-07'),
  sessionCount: 5,
  avgDurationMinutes: 410,
  bedtimeAdherencePercent: 80,
  avgStepsCount: 5000,
  consistencyScore: 55,
}
const deltas = computeDeltas(tighter, last)
assert.equal(deltas.bedtimeAdherencePercent, 40)
assert.equal(didImprove(deltas), true)
const wired = buildVerdictFromDeltas(deltas)
assert.equal(wired.driver, 'bedtimeAdherence')
assert.match(wired.reason, /Improved — driven by bedtime adherence/)

console.log(
  'Improvement verdict OK — tighter ±15m bedtime adherence → Improved (adherence driver)'
)
