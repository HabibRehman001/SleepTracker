/**
 * Step 65 — Consistency Score card with circular progress ring (0–100).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ConsistencyRing,
  ConsistencyScoreCardView,
  clampConsistencyScore,
  consistencyBand,
  consistencyLabel,
} from '../src/features/dashboard/ConsistencyScoreCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(
  join(root, 'src/features/dashboard/ConsistencyScoreCard.tsx'),
  'utf8'
)
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const grid = readFileSync(
  join(root, 'src/features/dashboard/StatCardsGrid.tsx'),
  'utf8'
)

assert.match(src, /export function ConsistencyScoreCard/)
assert.match(src, /export function ConsistencyRing/)
assert.match(src, /strokeDasharray/)
assert.match(src, /strokeDashoffset/)
assert.match(src, /circle/)
assert.match(page, /ConsistencyScoreCard/)
// KPI strip stays plain-number; ring card is the distinct treatment
assert.match(grid, /consistencyScore/)
assert.doesNotMatch(grid, /ConsistencyRing|strokeDashoffset/)

assert.equal(clampConsistencyScore(72.4), 72)
assert.equal(clampConsistencyScore(-5), 0)
assert.equal(clampConsistencyScore(140), 100)
assert.equal(consistencyBand(90), 'high')
assert.equal(consistencyBand(60), 'moderate')
assert.equal(consistencyBand(20), 'low')
assert.equal(consistencyLabel(90), 'Stable schedule')

const ringHtml = renderToStaticMarkup(
  createElement(ConsistencyRing, { score: 72 })
)
assert.match(ringHtml, /data-testid="consistency-ring"/)
assert.match(ringHtml, /data-score="72"/)
assert.match(ringHtml, /data-band="moderate"/)
assert.match(ringHtml, /<circle/)
assert.match(ringHtml, /stroke-dasharray|strokeDasharray/)
assert.match(ringHtml, /data-testid="consistency-ring-progress"/)
assert.match(ringHtml, />72</)

const cardHtml = renderToStaticMarkup(
  createElement(ConsistencyScoreCardView, { score: 72 })
)
assert.match(cardHtml, /Consistency/)
assert.match(cardHtml, /data-testid="consistency-score-card"/)
assert.match(cardHtml, /Moderate variation/)
assert.match(cardHtml, /consistency-ring/)

console.log('Consistency Score card OK — circular ring 0–100 (score 72)')
