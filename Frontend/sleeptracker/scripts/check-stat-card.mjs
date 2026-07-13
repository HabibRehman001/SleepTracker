/**
 * Step 61 — StatCard is pure presentation; works for time + score values.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StatCard } from '../src/features/dashboard/StatCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cardSrc = readFileSync(
  join(root, 'src/features/dashboard/StatCard.tsx'),
  'utf8'
)
const gridSrc = readFileSync(
  join(root, 'src/features/dashboard/StatCardsGrid.tsx'),
  'utf8'
)

assert.match(cardSrc, /export function StatCard/)
assert.match(cardSrc, /label:\s*string/)
assert.match(cardSrc, /trend\?:/)
assert.doesNotMatch(cardSrc, /useQuery|api\.|useDashboardStats|fetch\(/)
assert.match(gridSrc, /<StatCard/)

const timeHtml = renderToStaticMarkup(
  createElement(StatCard, {
    label: 'Sleep Debt',
    value: '3h 40m',
    trend: '+20m vs last week',
    'data-testid': 'debt',
  })
)
assert.match(timeHtml, /Sleep Debt/)
assert.match(timeHtml, /3h 40m/)
assert.match(timeHtml, /\+20m vs last week/)

const scoreHtml = renderToStaticMarkup(
  createElement(StatCard, {
    label: 'Consistency',
    value: '72',
    trend: 'Moderate variation',
    'data-testid': 'score',
  })
)
assert.match(scoreHtml, /Consistency/)
assert.match(scoreHtml, />72</)
assert.match(scoreHtml, /Moderate variation/)

console.log('StatCard contract OK — time + score pure presentation')
