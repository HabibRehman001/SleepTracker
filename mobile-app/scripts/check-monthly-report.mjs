/**
 * Step 187 — Monthly Report screen (this vs last month, Phase 1 layout).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  arrowGlyph,
  buildReportMetrics,
  formatDurationMinutes,
  formatMonthLabel,
} from '../services/monthlyReportMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/monthly-report.tsx'), 'utf8')
const column = readFileSync(
  join(root, 'components/reports/MonthStatsColumn.tsx'),
  'utf8'
)
const math = readFileSync(join(root, 'services/monthlyReportMath.ts'), 'utf8')
const api = readFileSync(join(root, 'services/monthlyReportApi.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'app/monthly-report.tsx')))
assert.match(screen, /testID=["']monthly-report-screen["']/)
assert.match(screen, /MonthStatsColumn|buildReportMetrics/)
assert.match(screen, /verdict|Improved — driven|monthly-report-verdict/)
assert.match(math, /bedtimeAdherence|Bedtime adherence/)
assert.match(column, /metric-row-|metric-arrow-/)
assert.match(math, /avgBedTime|avgDuration|consistency|avgSteps/)
assert.match(api, /\/stats\/comparison/)
assert.match(layout, /monthly-report/)
assert.match(index, /open-monthly-report|\/monthly-report/)
assert.match(settings, /settings-open-monthly-report|\/monthly-report/)
assert.match(summary, /Step 187|6\.135.*187|Monthly Report|monthly-report/)
assert.ok(pkg.scripts['test:monthly-report'])

assert.equal(formatMonthLabel('2026-06'), 'June 2026')
assert.equal(formatDurationMinutes(432), '7h 12m')
assert.equal(arrowGlyph('improved'), '↑')
assert.equal(arrowGlyph('regressed'), '↓')

const sample = {
  thisMonth: {
    month: '2026-07',
    sessionCount: 10,
    avgDurationMinutes: 420,
    avgDurationHours: 7,
    avgBedTime: '23:30',
    avgWakeTime: '06:30',
    consistencyScore: 80,
    bedtimeAdherencePercent: 80,
    avgStepsCount: 7500,
  },
  lastMonth: {
    month: '2026-06',
    sessionCount: 8,
    avgDurationMinutes: 390,
    avgDurationHours: 6.5,
    avgBedTime: '00:00',
    avgWakeTime: '06:30',
    consistencyScore: 70,
    bedtimeAdherencePercent: 40,
    avgStepsCount: 6000,
  },
  improved: true,
  deltas: {
    sessionCount: 2,
    avgDurationMinutes: 30,
    consistencyScore: 10,
    bedtimeAdherencePercent: 40,
    avgStepsCount: 1500,
    avgBedTimeMinutes: -30,
    avgWakeTimeMinutes: 0,
  },
  verdict: {
    improved: true,
    score: 1,
    driver: 'bedtimeAdherence',
    driverLabel: 'bedtime adherence (±15 min)',
    reason: 'Improved — driven by bedtime adherence (±15 min)',
  },
}

const metrics = buildReportMetrics(sample)
assert.equal(metrics.length, 4)
assert.equal(metrics[0].key, 'avgBedTime')
assert.equal(metrics[1].key, 'avgDuration')
assert.equal(metrics[2].key, 'consistency')
assert.equal(metrics[2].label, 'Bedtime adherence')
assert.equal(metrics[3].key, 'avgSteps')
assert.equal(metrics[0].tone, 'improved')
assert.equal(metrics[1].tone, 'improved')
assert.equal(metrics[2].tone, 'improved')
assert.equal(metrics[3].tone, 'improved')
assert.match(metrics[2].currentDisplay, /80%/)
assert.ok(
  metrics[0].deltaDisplay && /earlier/.test(metrics[0].deltaDisplay),
  metrics[0].deltaDisplay
)
assert.match(sample.verdict.reason, /Improved — driven by bedtime adherence/)

console.log(
  'Monthly report contract OK — this vs last + bedtime adherence verdict'
)
