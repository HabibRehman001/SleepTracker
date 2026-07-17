/**
 * Step 103 — Reports page: this vs last month + green up arrows when improved.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  compareMonthlySummaries,
} from '../src/features/reports/reportCompare.ts'
import { ReportsCompareGrid } from '../src/features/reports/MonthStatsColumn.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const page = readFileSync(
  join(root, 'src/features/reports/ReportsPage.tsx'),
  'utf8'
)
const column = readFileSync(
  join(root, 'src/features/reports/MonthStatsColumn.tsx'),
  'utf8'
)

assert.match(app, /ReportsPage/)
assert.match(app, /path="reports"/)
assert.match(page, /reports-page|ReportsCompareGrid/)
assert.match(page, /useMonthCompare/)
assert.match(column, /reports-compare-grid|md:grid-cols-2/)
assert.match(column, /text-emerald|improved/)
assert.match(column, /ArrowUp/)

function summary(partial) {
  return {
    entryCount: 10,
    avgDuration: null,
    avgQuality: null,
    bestDayQuality: null,
    worstDayQuality: null,
    bestDayDate: null,
    worstDayDate: null,
    insights: [],
    ...partial,
  }
}

// Month 2 (current) better than month 1 (previous) on every metric.
const previous = summary({
  month: '2026-05',
  avgQuality: 5,
  avgDuration: 400,
  bestDayQuality: 6,
  worstDayQuality: 3,
})
const current = summary({
  month: '2026-06',
  avgQuality: 8,
  avgDuration: 450,
  bestDayQuality: 9,
  worstDayQuality: 6,
})

const metrics = compareMonthlySummaries(current, previous)
assert.ok(metrics.length >= 4)
for (const m of metrics) {
  assert.equal(m.direction, 'up', `${m.key} should point up`)
  assert.equal(m.tone, 'improved', `${m.key} should be improved/green`)
  assert.ok(m.delta != null && m.delta > 0, `${m.key} positive delta`)
}

const html = renderToStaticMarkup(
  createElement(ReportsCompareGrid, { current, previous, metrics })
)
assert.match(html, /reports-compare-grid/)
assert.match(html, /This month/)
assert.match(html, /Last month/)
assert.match(html, /data-tone="improved"/)
assert.match(html, /data-direction="up"/)
assert.match(html, /text-emerald/)

console.log('Reports page contract OK (MoM grid + green up arrows)')
