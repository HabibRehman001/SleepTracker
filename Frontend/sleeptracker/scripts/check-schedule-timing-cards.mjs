/**
 * Step 66 — Avg Bedtime / Wake / Latency cards as clock times, not raw minutes.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ScheduleTimingCardView,
  formatClockTime,
  formatLatencyDisplay,
  formatMinutesAsClock,
} from '../src/features/dashboard/ScheduleTimingCards.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(
  join(root, 'src/features/dashboard/ScheduleTimingCards.tsx'),
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

assert.match(src, /export function ScheduleTimingCards/)
assert.match(src, /formatMinutesAsClock/)
assert.match(src, /4:12 AM|formatMinutesAsClock/)
assert.match(page, /ScheduleTimingCards/)
assert.match(grid, /formatClockTime/)
assert.match(grid, /formatLatencyDisplay/)
assert.doesNotMatch(grid, /avgBedtime \?\? '—'/)

// Goal example: 4:12 AM — not raw minutes (252)
assert.equal(formatMinutesAsClock(4 * 60 + 12), '4:12 AM')
assert.equal(formatClockTime(252), '4:12 AM')
assert.equal(formatClockTime('04:12'), '4:12 AM')
assert.equal(formatClockTime('22:00'), '10:00 PM')
assert.equal(formatClockTime('00:20'), '12:20 AM')
assert.equal(formatClockTime('12:00'), '12:00 PM')
assert.equal(formatClockTime(null), '—')
assert.notEqual(String(252), formatClockTime(252))

assert.equal(formatLatencyDisplay(45), '45m')
assert.equal(formatLatencyDisplay(65), '1h 05m')
assert.equal(formatLatencyDisplay(null), '—')

const bedHtml = renderToStaticMarkup(
  createElement(ScheduleTimingCardView, {
    metric: 'bedtime',
    value: '04:12',
  })
)
assert.match(bedHtml, /Avg Bedtime/)
assert.match(bedHtml, />4:12 AM</)
assert.doesNotMatch(bedHtml, />252</)
assert.doesNotMatch(bedHtml, />04:12</)

const wakeHtml = renderToStaticMarkup(
  createElement(ScheduleTimingCardView, {
    metric: 'wake',
    value: 6 * 60 + 10,
  })
)
assert.match(wakeHtml, />6:10 AM</)

const latencyHtml = renderToStaticMarkup(
  createElement(ScheduleTimingCardView, {
    metric: 'latency',
    value: 45,
  })
)
assert.match(latencyHtml, /Avg Latency/)
assert.match(latencyHtml, />45m</)
assert.doesNotMatch(latencyHtml, />45</)

console.log('Schedule timing cards OK — 4:12 AM clock display (not raw minutes)')
