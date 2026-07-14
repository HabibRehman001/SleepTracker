/**
 * Step 101 — Experiments list: card grid with quality % summary + detail link.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { qualityChangeSummary } from '../src/features/experiments/experimentFormat.ts'
import { ExperimentListCard } from '../src/features/experiments/ExperimentListCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(
  join(root, 'src/features/experiments/ExperimentsPage.tsx'),
  'utf8'
)
const card = readFileSync(
  join(root, 'src/features/experiments/ExperimentListCard.tsx'),
  'utf8'
)

assert.match(page, /experiments-card-grid|ExperimentListCard/)
assert.match(page, /ExperimentListCard/)
assert.match(card, /Quality improved|qualityChangeSummary/)
assert.match(card, /to=\{`\/experiments\/\$\{experiment\.id\}`\}/)

const improved = qualityChangeSummary({
  key: 'sleepQuality',
  label: 'Sleep quality',
  unit: 'points',
  beforeMean: 5,
  duringMean: 8,
  diff: 3,
  beforeN: 14,
  duringN: 7,
  pValue: 0.01,
  t: -5,
  df: 18,
  significant: true,
})
assert.equal(improved, 'Quality improved by 60%')

const declined = qualityChangeSummary({
  key: 'sleepQuality',
  label: 'Sleep quality',
  unit: 'points',
  beforeMean: 8,
  duringMean: 6,
  diff: -2,
  beforeN: 10,
  duringN: 10,
  pValue: 0.1,
  t: 1,
  df: 18,
  significant: false,
})
assert.equal(declined, 'Quality declined by 25%')

assert.equal(qualityChangeSummary(null), 'Not enough quality data yet')

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
const html = renderToStaticMarkup(
  createElement(
    QueryClientProvider,
    { client: qc },
    createElement(
      MemoryRouter,
      null,
      createElement(ExperimentListCard, {
        experiment: {
          id: 'exp1',
          name: 'No phone',
          startDate: '2026-07-01T00:00:00.000Z',
          endDate: '2026-07-14T00:00:00.000Z',
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      })
    )
  )
)
assert.match(html, /experiment-card-exp1/)
assert.match(html, /No phone/)
assert.match(html, /\/experiments\/exp1/)

console.log('Experiments list contract OK (card grid + quality % summary)')
