/**
 * Step 87 — Weekday vs weekend grouped bar chart.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildWeekdayWeekendBarRows,
  computeWeekdayWeekendAverages,
  isWeekendEntryDate,
  WeekdayWeekendChart,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/components/charts/weekdayWeekendComparison.ts'),
  'utf8'
)
const chartSrc = readFileSync(
  join(root, 'src/components/charts/WeekdayWeekendChart.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(mathSrc, /buildWeekdayWeekendBarRows|computeWeekdayWeekendAverages/)
assert.match(chartSrc, /BarChart/)
assert.match(chartSrc, /weekday|weekend/i)
assert.match(pageSrc, /WeekdayWeekendChart/)

assert.equal(isWeekendEntryDate(new Date(2026, 0, 10)), true) // Sat
assert.equal(isWeekendEntryDate(new Date(2026, 0, 7)), false) // Wed

function fakeEntry(date, opts) {
  const bed = opts.bed
  const wake = opts.wake
  return {
    id: date,
    date: `${date}T00:00:00.000Z`,
    bedTime: bed.toISOString(),
    attemptSleepTime: bed.toISOString(),
    estimatedSleepTime: bed.toISOString(),
    wakeTime: wake.toISOString(),
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: opts.quality,
    energyMorning: null,
    energyWork: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
    mood: null,
    food: null,
    exercise: null,
    environment: null,
    health: null,
  }
}

// Mon–Fri: bed 22:00, 7h sleep, quality 6
// Sat–Sun: bed 23:00, 8h sleep, quality 8
const entries = [
  fakeEntry('2026-01-05', {
    bed: new Date(2026, 0, 5, 22, 0),
    wake: new Date(2026, 0, 6, 5, 0),
    quality: 6,
  }),
  fakeEntry('2026-01-06', {
    bed: new Date(2026, 0, 6, 22, 0),
    wake: new Date(2026, 0, 7, 5, 0),
    quality: 6,
  }),
  fakeEntry('2026-01-07', {
    bed: new Date(2026, 0, 7, 22, 0),
    wake: new Date(2026, 0, 8, 5, 0),
    quality: 6,
  }),
  fakeEntry('2026-01-10', {
    bed: new Date(2026, 0, 10, 23, 0),
    wake: new Date(2026, 0, 11, 7, 0),
    quality: 8,
  }),
  fakeEntry('2026-01-11', {
    bed: new Date(2026, 0, 11, 23, 0),
    wake: new Date(2026, 0, 12, 7, 0),
    quality: 8,
  }),
]

const averages = computeWeekdayWeekendAverages(entries)
assert.equal(averages.weekday.n, 3)
assert.equal(averages.weekend.n, 2)
assert.ok(averages.weekday.bedtimeMinutes != null)
assert.ok(Math.abs(averages.weekday.bedtimeMinutes - 22 * 60) < 1)
assert.ok(Math.abs(averages.weekend.bedtimeMinutes - 23 * 60) < 1)
assert.equal(averages.weekday.durationHours, 7)
assert.equal(averages.weekend.durationHours, 8)
assert.equal(averages.weekday.quality, 6)
assert.equal(averages.weekend.quality, 8)

const rows = buildWeekdayWeekendBarRows(entries)
assert.equal(rows.length, 3)
assert.deepEqual(
  rows.map((r) => r.metric),
  ['Avg bedtime', 'Avg duration', 'Avg quality']
)
assert.ok(rows.every((r) => 'weekday' in r && 'weekend' in r))
assert.equal(rows[0].weekdayText, '22:00')
assert.equal(rows[0].weekendText, '23:00')
assert.equal(rows[1].weekdayText, '7h')
assert.equal(rows[1].weekendText, '8h')
// Within a metric, taller side = 100
assert.equal(rows[2].weekend, 100)
assert.ok(rows[2].weekday < rows[2].weekend)

const html = renderToStaticMarkup(
  createElement(WeekdayWeekendChart, { entries: [], rows })
)
assert.match(html, /Weekday vs weekend/)
assert.match(html, /weekday-weekend-chart/)

console.log(
  'Weekday vs weekend chart OK — grouped bars for bedtime / duration / quality'
)
