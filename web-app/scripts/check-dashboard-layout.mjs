/**
 * Step 59 — Dashboard layout: 8 stat cards, charts, correlation cards.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const stats = readFileSync(
  join(root, 'src/features/dashboard/StatCardsGrid.tsx'),
  'utf8'
)
const charts = readFileSync(
  join(root, 'src/features/dashboard/DashboardCharts.tsx'),
  'utf8'
)
const corr = readFileSync(
  join(root, 'src/features/dashboard/CorrelationCards.tsx'),
  'utf8'
)

assert.match(page, /StatCardsGrid/)
assert.match(page, /DashboardCharts/)
assert.match(page, /CorrelationCards/)
assert.match(page, /max-w-6xl/)

for (const key of [
  'todaySleep',
  'sleepDebt',
  'avg7day',
  'avg30day',
  'consistencyScore',
  'avgBedtime',
  'avgWakeTime',
  'avgLatency',
]) {
  assert.match(stats, new RegExp(key))
}

assert.match(charts, /LineChartCard/)
assert.doesNotMatch(charts, /from 'recharts'/)
assert.match(corr, /groupA/)
assert.match(corr, /groupB/)

console.log('Dashboard layout contract OK — 8 KPIs + charts + correlations')
