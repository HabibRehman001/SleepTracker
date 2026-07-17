/**
 * Step 64 — 7-day / 30-day average cards.
 * Manually average 7 seeded-style durations (spreadsheet) → card must match exactly.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AverageSleepCardView,
  averageSleepHours,
  formatAverageHours,
  spreadsheetAverage,
} from '../src/features/dashboard/AverageSleepCards.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(
  join(root, 'src/features/dashboard/AverageSleepCards.tsx'),
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

assert.match(src, /export function AverageSleepCards/)
assert.match(src, /export function AverageSleepCardView/)
assert.match(src, /avg-7-day-card/)
assert.match(src, /avg-30-day-card/)
assert.match(page, /AverageSleepCards/)
assert.match(grid, /formatAverageHours/)

/** Same 7 durations as Backend analytics.service.test computeSummary fixture. */
const SEEDED_LAST_7 = [7, 7.5, 8, 6.5, 8, 7, 7.5]

// Spreadsheet: =AVERAGE(7, 7.5, 8, 6.5, 8, 7, 7.5) → 7.357… → 7.36
const spreadsheetAvg = spreadsheetAverage(SEEDED_LAST_7)
assert.equal(spreadsheetAvg, 7.36)

const entries = SEEDED_LAST_7.map((hours, index) => {
  const day = String(index + 1).padStart(2, '0')
  const estimated = `2026-01-${day}T00:00:00.000Z`
  const wakeMs = Date.parse(estimated) + hours * 3_600_000
  return {
    date: estimated,
    estimatedSleepTime: estimated,
    attemptSleepTime: estimated,
    bedTime: estimated,
    wakeTime: new Date(wakeMs).toISOString(),
  }
})

const computed7 = averageSleepHours(entries, 7)
const computed30 = averageSleepHours(entries, 30)
assert.equal(computed7, spreadsheetAvg, 'avg7 must match spreadsheet exactly')
assert.equal(computed30, spreadsheetAvg, 'avg30 with ≤30 nights = same mean')
assert.equal(formatAverageHours(computed7), '7.36h')

const html7 = renderToStaticMarkup(
  createElement(AverageSleepCardView, {
    window: 7,
    hours: spreadsheetAvg,
  })
)
assert.match(html7, /7-day Avg/)
assert.match(html7, /data-testid="avg-7-day-card-value"/)
assert.match(html7, />7\.36h</)

const html30 = renderToStaticMarkup(
  createElement(AverageSleepCardView, {
    window: 30,
    hours: spreadsheetAvg,
    trend: '+0.00h vs 30d',
  })
)
assert.match(html30, /30-day Avg/)
assert.match(html30, />7\.36h</)

console.log(
  `Average cards OK — spreadsheet last7=[${SEEDED_LAST_7.join(', ')}] avg=${spreadsheetAvg} matches card 7.36h`
)
