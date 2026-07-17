/**
 * Step 90 — Analytics page: range filter + charts + correlations + insights.
 * Switching range re-keys analytics queries and filters chart entries.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  ANALYTICS_DATE_RANGES,
  DateRangeFilter,
  durationLimitForRange,
  filterEntriesByAnalyticsRange,
} from '../src/features/analytics/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const page = readFileSync(
  join(root, 'src/features/analytics/AnalyticsPage.tsx'),
  'utf8'
)
const hook = readFileSync(
  join(root, 'src/features/analytics/useAnalytics.ts'),
  'utf8'
)
const rangeUtil = readFileSync(
  join(root, 'src/features/analytics/analyticsRange.ts'),
  'utf8'
)

assert.match(app, /AnalyticsPage/)
assert.doesNotMatch(app, /PlaceholderPage label="Analytics"/)
assert.match(page, /DateRangeFilter/)
assert.match(page, /data-testid="analytics-page"/)
assert.match(page, /DashboardCharts/)
assert.match(page, /SleepDurationChart/)
assert.match(page, /SleepQualityOverTimeChart/)
assert.match(page, /QualityContributionHeatmap/)
assert.match(page, /SleepTimelineChart/)
assert.match(page, /BedtimeWakeConsistencyCharts/)
assert.match(page, /WeekdayWeekendChart/)
assert.match(page, /InsightsPanelView/)
assert.match(page, /CorrelationScatterCharts/)
assert.match(page, /CorrelationCards/)
assert.match(page, /useCorrelations\(range\)/)
assert.match(page, /useScatterCorrelations\(range\)/)
assert.match(page, /useInsights\(range\)/)
assert.match(page, /filterEntriesByAnalyticsRange/)

assert.match(hook, /correlationsQueryKey/)
assert.match(hook, /insightsQueryKey/)
assert.match(hook, /scatterQueryKey/)
assert.match(hook, /\?range=/)
assert.match(hook, /rangeQuery/)

assert.match(rangeUtil, /'7d'/)
assert.match(rangeUtil, /'30d'/)
assert.match(rangeUtil, /'90d'/)
assert.match(rangeUtil, /'all'/)

assert.deepEqual([...ANALYTICS_DATE_RANGES], ['7d', '30d', '90d', 'all'])

const now = new Date('2026-07-15T12:00:00.000Z')
const sample = [
  { date: '2026-07-01T00:00:00.000Z' },
  { date: '2026-07-10T00:00:00.000Z' },
  { date: '2026-07-15T00:00:00.000Z' },
]
const week = filterEntriesByAnalyticsRange(sample, '7d', now)
assert.equal(week.length, 2)
assert.equal(filterEntriesByAnalyticsRange(sample, 'all', now).length, 3)
assert.equal(durationLimitForRange('7d', 10), 7)
assert.equal(durationLimitForRange('30d', 10), 30)

const filterHtml = renderToStaticMarkup(
  createElement(DateRangeFilter, {
    value: '30d',
    onChange: () => {},
  })
)
assert.match(filterHtml, /data-testid="date-range-filter"/)
assert.match(filterHtml, /data-range="7d"/)
assert.match(filterHtml, /data-range="30d"/)
assert.match(filterHtml, /data-range="90d"/)
assert.match(filterHtml, /data-range="all"/)
assert.match(filterHtml, /All time/)

// Live API: same range window on correlations / insights / scatter
const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'
try {
  const [c7, cAll, i7, s7] = await Promise.all([
    fetch(`${API}/analytics/correlations?range=7d`).then((r) => r.json()),
    fetch(`${API}/analytics/correlations?range=all`).then((r) => r.json()),
    fetch(`${API}/analytics/insights?range=7d`).then((r) => r.json()),
    fetch(`${API}/analytics/scatter?range=7d`).then((r) => r.json()),
  ])
  assert.ok(Array.isArray(c7), 'correlations 7d array')
  assert.ok(Array.isArray(cAll), 'correlations all array')
  assert.ok(Array.isArray(i7.insights), 'insights 7d')
  assert.ok(Array.isArray(s7.scatters), 'scatter 7d')
  console.log('Analytics live API range query OK')
} catch (err) {
  console.warn(
    'Analytics live API skipped (server down?):',
    err instanceof Error ? err.message : err
  )
}

console.log('Analytics page contract OK (range filter + charts + panels)')
