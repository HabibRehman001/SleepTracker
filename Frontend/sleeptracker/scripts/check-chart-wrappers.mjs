/**
 * Step 81 — Recharts wrappers isolate colors / tooltips / axes.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  heatColor,
  HeatmapCalendar,
  LineChartCard,
  ScatterChartCard,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const file of [
  'LineChartCard.tsx',
  'ScatterChartCard.tsx',
  'HeatmapCalendar.tsx',
  'chartTheme.ts',
]) {
  const src = readFileSync(
    join(root, 'src/components/charts', file),
    'utf8'
  )
  assert.ok(src.length > 50, `${file} present`)
}

const lineSrc = readFileSync(
  join(root, 'src/components/charts/LineChartCard.tsx'),
  'utf8'
)
const scatterSrc = readFileSync(
  join(root, 'src/components/charts/ScatterChartCard.tsx'),
  'utf8'
)
const heatSrc = readFileSync(
  join(root, 'src/components/charts/HeatmapCalendar.tsx'),
  'utf8'
)
const dashCharts = readFileSync(
  join(root, 'src/features/dashboard/DashboardCharts.tsx'),
  'utf8'
)

assert.match(lineSrc, /from 'recharts'/)
assert.match(lineSrc, /chartTooltipStyle|chartColors/)
assert.match(scatterSrc, /ScatterChart/)
assert.match(heatSrc, /heatColor/)
assert.match(dashCharts, /LineChartCard/)
assert.doesNotMatch(dashCharts, /from 'recharts'/)

assert.equal(heatColor(null), 'var(--muted)')
assert.equal(heatColor(0, 10), 'var(--muted)')
assert.equal(heatColor(10, 10), 'var(--chart-5)')

const lineHtml = renderToStaticMarkup(
  createElement(LineChartCard, {
    title: 'Sleep duration (14d)',
    data: [
      { date: '07-01', hours: 7.5 },
      { date: '07-02', hours: 6 },
    ],
    xKey: 'date',
    series: [{ dataKey: 'hours', name: 'Hours' }],
  })
)
assert.match(lineHtml, /Sleep duration/)
assert.match(lineHtml, /line-chart-card|data-testid/)

const scatterHtml = renderToStaticMarkup(
  createElement(ScatterChartCard, {
    title: 'Stress vs quality',
    data: [
      { stress: 2, quality: 8 },
      { stress: 9, quality: 3 },
    ],
    xKey: 'stress',
    yKey: 'quality',
  })
)
assert.match(scatterHtml, /Stress vs quality/)

const heatHtml = renderToStaticMarkup(
  createElement(HeatmapCalendar, {
    title: 'Quality calendar',
    days: [
      { date: '2026-07-01', value: 8 },
      { date: '2026-07-02', value: 3 },
      { date: '2026-07-03', value: 6 },
    ],
    startDate: '2026-07-01',
    endDate: '2026-07-03',
  })
)
assert.match(heatHtml, /Quality calendar/)
assert.match(heatHtml, /heatmap-calendar/)

console.log(
  'Chart wrappers OK — LineChartCard, ScatterChartCard, HeatmapCalendar; DashboardCharts uses LineChartCard'
)
