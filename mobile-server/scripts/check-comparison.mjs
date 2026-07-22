/**
 * Step 130 — month-over-month comparison contract + pure helpers.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  computeDeltas,
  didImprove,
  emptyMonthStats,
  previousUtcMonthKey,
  utcMonthKey,
} from '../src/services/comparison.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/stats.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/comparison.service.ts'),
  'utf8'
)

assert.match(appSrc, /\/stats/)
assert.match(routes, /\/comparison/)
assert.match(service, /didImprove|improved/)
assert.match(service, /deltas/)
assert.match(service, /bedtimeAdherencePercent|verdict/)

assert.equal(previousUtcMonthKey('2026-07'), '2026-06')
assert.equal(previousUtcMonthKey('2026-01'), '2025-12')
assert.match(utcMonthKey(new Date(Date.UTC(2026, 6, 18))), /^2026-07$/)

const last = {
  ...emptyMonthStats('2026-06'),
  sessionCount: 2,
  avgDurationMinutes: 420,
  avgDurationHours: 7,
  avgBedTime: '00:00',
  avgWakeTime: '07:00',
  consistencyScore: 70,
  bedtimeAdherencePercent: 40,
  avgStepsCount: 4000,
}
const better = {
  ...emptyMonthStats('2026-07'),
  sessionCount: 3,
  avgDurationMinutes: 480,
  avgDurationHours: 8,
  avgBedTime: '23:00',
  avgWakeTime: '07:00',
  consistencyScore: 90,
  bedtimeAdherencePercent: 80,
  avgStepsCount: 5500,
}

const deltas = computeDeltas(better, last)
assert.equal(deltas.avgDurationMinutes, 60)
assert.ok(deltas.consistencyScore != null && deltas.consistencyScore > 0)
assert.ok(deltas.avgStepsCount != null && deltas.avgStepsCount > 0)
assert.equal(deltas.bedtimeAdherencePercent, 40)
assert.equal(didImprove(deltas), true)

const worse = computeDeltas(last, better)
assert.equal(didImprove(worse), false)

console.log('Comparison contract OK — deltas + weighted improved verdict')
