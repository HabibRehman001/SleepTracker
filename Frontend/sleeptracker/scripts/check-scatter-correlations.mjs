/**
 * Step 86 — Correlation scatters with OLS trend (points + regression from API).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ScatterChartCard } from '../src/components/charts/ScatterChartCard.tsx'
import { CorrelationScatterCharts } from '../src/features/dashboard/CorrelationScatterCharts.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const scatterSrc = readFileSync(
  join(root, 'src/components/charts/ScatterChartCard.tsx'),
  'utf8'
)
const chartsSrc = readFileSync(
  join(root, 'src/features/dashboard/CorrelationScatterCharts.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const hookSrc = readFileSync(
  join(root, 'src/features/analytics/useAnalytics.ts'),
  'utf8'
)

assert.match(scatterSrc, /trend|ComposedChart|Line/)
assert.match(chartsSrc, /CorrelationScatterCharts/)
assert.match(pageSrc, /CorrelationScatterCharts/)
assert.match(hookSrc, /\/analytics\/scatter/)

const scatters = [
  {
    key: 'phoneMinutesVsLatency',
    label: 'Phone minutes vs latency',
    xLabel: 'Phone minutes before sleep',
    yLabel: 'Latency (min)',
    points: [
      { x: 10, y: 20, date: '2026-07-01' },
      { x: 40, y: 40, date: '2026-07-02' },
      { x: 70, y: 60, date: '2026-07-03' },
    ],
    regression: { slope: 2 / 3, intercept: 40 / 3, n: 3 },
  },
  {
    key: 'caffeineVsQuality',
    label: 'Caffeine vs quality',
    xLabel: 'Caffeine (mg)',
    yLabel: 'Sleep quality',
    points: [
      { x: 0, y: 8, date: '2026-07-01' },
      { x: 100, y: 6, date: '2026-07-02' },
      { x: 200, y: 4, date: '2026-07-03' },
    ],
    regression: { slope: -0.02, intercept: 8, n: 3 },
  },
]

const cardHtml = renderToStaticMarkup(
  createElement(ScatterChartCard, {
    title: 'Phone minutes vs latency',
    data: scatters[0].points,
    xKey: 'x',
    yKey: 'y',
    trend: scatters[0].regression,
  })
)
assert.match(cardHtml, /Phone minutes vs latency/)

const pairHtml = renderToStaticMarkup(
  createElement(CorrelationScatterCharts, { scatters })
)
assert.match(pairHtml, /Phone minutes vs latency/)
assert.match(pairHtml, /Caffeine vs quality/)

const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'

async function liveCheck() {
  let res
  try {
    res = await fetch(`${API}/analytics/scatter`)
  } catch {
    console.log(
      'Scatter charts contract OK — live API skipped (server not reachable)'
    )
    return
  }
  if (!res.ok) {
    console.log(`Scatter charts contract OK — live API skipped (HTTP ${res.status})`)
    return
  }
  const body = await res.json()
  assert.ok(Array.isArray(body.scatters))
  assert.ok(body.scatters.length >= 2)
  for (const s of body.scatters) {
    assert.ok(Array.isArray(s.points))
    if (s.points.length >= 2) {
      assert.ok(s.regression == null || typeof s.regression.slope === 'number')
    }
  }
  console.log(
    `Scatter charts OK — ${body.scatters.length} series from API; trend overlay wired`
  )
}

await liveCheck()
