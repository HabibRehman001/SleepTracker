/**
 * Step 67/71 — CorrelationCard side-by-side; multi-outcome avg display.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CorrelationCard,
  formatCorrelationAvg,
  higherValueSide,
} from '../src/features/dashboard/CorrelationCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cardSrc = readFileSync(
  join(root, 'src/features/dashboard/CorrelationCard.tsx'),
  'utf8'
)
const listSrc = readFileSync(
  join(root, 'src/features/dashboard/CorrelationCards.tsx'),
  'utf8'
)

assert.match(cardSrc, /export function CorrelationCard/)
assert.match(cardSrc, /formatCorrelationAvg/)
assert.match(listSrc, /<CorrelationCard/)
assert.match(listSrc, /c\.outcome/)
assert.match(listSrc, /c\.label/)

assert.equal(
  formatCorrelationAvg({ label: 'YES', avg: 87, n: 4 }, 'latency'),
  '87 min avg latency'
)
assert.equal(
  formatCorrelationAvg({ label: 'YES', avg: 7.5, n: 4 }, 'quality'),
  '7.5 avg quality'
)
assert.equal(
  formatCorrelationAvg({ label: 'NO', avg: null, n: 0 }, 'latency'),
  'not enough data'
)
assert.equal(
  higherValueSide(
    { label: 'YES', avg: 87, n: 4 },
    { label: 'NO', avg: 21, n: 3 }
  ),
  'A'
)

const phoneHtml = renderToStaticMarkup(
  createElement(CorrelationCard, {
    factor: 'Phone before sleep vs latency',
    outcome: 'latency',
    groupA: { label: 'YES', avg: 87, n: 5 },
    groupB: { label: 'NO', avg: 21, n: 4 },
  })
)
assert.match(phoneHtml, /Phone before sleep vs latency/)
assert.match(phoneHtml, /87 min avg latency/)
assert.match(phoneHtml, /21 min avg latency/)
assert.doesNotMatch(phoneHtml, /NaN/)

const emptyHtml = renderToStaticMarkup(
  createElement(CorrelationCard, {
    factor: 'Phone before sleep vs quality',
    outcome: 'quality',
    groupA: { label: 'YES', avg: 7, n: 5 },
    groupB: { label: 'NO', avg: null, n: 0 },
  })
)
assert.match(emptyHtml, /not enough data/)
assert.doesNotMatch(emptyHtml, /NaN/)

console.log(
  'CorrelationCard OK — multi-outcome avg; empty group → not enough data'
)
