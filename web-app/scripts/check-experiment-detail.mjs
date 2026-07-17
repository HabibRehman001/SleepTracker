/**
 * Step 100 — Experiment detail: header, before/during/Δ cards, chart + start marker.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExperimentDiffCards } from '../src/features/experiments/ExperimentDiffCards.tsx'
import {
  formatDiffValue,
  formatMetricValue,
  pickPrimaryMetric,
} from '../src/features/experiments/experimentFormat.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const detail = readFileSync(
  join(root, 'src/features/experiments/ExperimentDetailPage.tsx'),
  'utf8'
)
const chart = readFileSync(
  join(root, 'src/features/experiments/ExperimentQualityChart.tsx'),
  'utf8'
)
const lineCard = readFileSync(
  join(root, 'src/components/charts/LineChartCard.tsx'),
  'utf8'
)
const listCard = readFileSync(
  join(root, 'src/features/experiments/ExperimentListCard.tsx'),
  'utf8'
)

assert.match(app, /experiments\/:id/)
assert.match(app, /ExperimentDetailPage/)
assert.match(detail, /experiment-detail-header/)
assert.match(detail, /ExperimentDiffCards/)
assert.match(detail, /ExperimentQualityChart/)
assert.match(chart, /verticalMarkerX|ReferenceLine|Start/)
assert.match(lineCard, /ReferenceLine/)
assert.match(lineCard, /verticalMarkerX/)
assert.match(listCard, /to=\{`\/experiments\/\$\{experiment\.id\}`\}/)

const metric = {
  key: 'sleepQuality',
  label: 'Sleep quality',
  unit: 'points',
  beforeMean: 5.2,
  duringMean: 8.1,
  diff: 2.9,
  beforeN: 14,
  duringN: 7,
  pValue: 0.01,
  t: -4,
  df: 18,
  significant: true,
}

assert.equal(pickPrimaryMetric([metric])?.key, 'sleepQuality')
assert.equal(formatMetricValue(5.2, 'points'), '5.2')
assert.equal(formatDiffValue(2.9, 'points'), '+2.9')

const html = renderToStaticMarkup(
  createElement(ExperimentDiffCards, { metric })
)
assert.match(html, /Before/)
assert.match(html, /During/)
assert.match(html, /Δ Diff|Diff/)
assert.match(html, /5\.2/)
assert.match(html, /8\.1/)
assert.match(html, /\+2\.9/)
assert.match(html, /experiment-stat-before/)
assert.match(html, /experiment-stat-during/)
assert.match(html, /experiment-stat-diff/)

console.log('Experiment detail contract OK (header cards + chart marker)')
