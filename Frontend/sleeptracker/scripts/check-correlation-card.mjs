/**
 * Step 67 — CorrelationCard side-by-side latency comparison.
 * Empty group → "not enough data" (never NaN).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CorrelationCard,
  formatCorrelationLatency,
  higherLatencySide,
} from '../src/features/dashboard/CorrelationCard.tsx'
import { correlationSideLabel } from '../src/features/dashboard/CorrelationCards.tsx'

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
assert.match(cardSrc, /factor:\s*string/)
assert.match(cardSrc, /groupA/)
assert.match(cardSrc, /groupB/)
assert.match(cardSrc, /not enough data/)
assert.match(cardSrc, /text-red-700|text-amber/)
assert.match(listSrc, /<CorrelationCard/)
assert.equal(correlationSideLabel('phoneUsedBeforeSleep', true), 'YES')
assert.equal(correlationSideLabel('phoneUsedBeforeSleep', false), 'NO')

assert.equal(
  formatCorrelationLatency({ label: 'YES', avgLatency: 87, n: 4 }),
  '87 min avg latency'
)
assert.equal(
  formatCorrelationLatency({ label: 'NO', avgLatency: null, n: 0 }),
  'not enough data'
)
assert.equal(
  formatCorrelationLatency({ label: 'NO', avgLatency: Number.NaN, n: 2 }),
  'not enough data'
)
assert.equal(
  higherLatencySide(
    { label: 'YES', avgLatency: 87, n: 4 },
    { label: 'NO', avgLatency: 21, n: 3 }
  ),
  'A'
)

const phoneHtml = renderToStaticMarkup(
  createElement(CorrelationCard, {
    factor: 'Phone before sleep',
    groupA: { label: 'YES', avgLatency: 87, n: 5 },
    groupB: { label: 'NO', avgLatency: 21, n: 4 },
  })
)
assert.match(phoneHtml, /Phone before sleep/)
assert.match(phoneHtml, /YES/)
assert.match(phoneHtml, /87 min avg latency/)
assert.match(phoneHtml, /NO/)
assert.match(phoneHtml, /21 min avg latency/)
assert.match(phoneHtml, /data-highlight="true"/)
assert.doesNotMatch(phoneHtml, /NaN/)

const emptyHtml = renderToStaticMarkup(
  createElement(CorrelationCard, {
    factor: 'Phone before sleep',
    groupA: { label: 'YES', avgLatency: 87, n: 5 },
    groupB: { label: 'NO', avgLatency: null, n: 0 },
  })
)
assert.match(emptyHtml, /not enough data/)
assert.doesNotMatch(emptyHtml, /NaN/)
assert.match(emptyHtml, /data-empty="true"/)

console.log(
  'CorrelationCard OK — YES 87 / NO 21 side-by-side; empty group → not enough data'
)
