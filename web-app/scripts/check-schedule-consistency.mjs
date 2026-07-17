/**
 * Step 83 — Bedtime & wake consistency: daily line + shaded ±1 SD band.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  BedtimeWakeConsistencyCharts,
  buildBedtimeConsistencySeries,
  circularMeanMinutes,
  circularStdMinutes,
  formatClockMinutes,
  ScheduleConsistencyChart,
  seriesToChartRows,
  unwrapToMean,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/components/charts/scheduleConsistency.ts'),
  'utf8'
)
const chartSrc = readFileSync(
  join(root, 'src/components/charts/ScheduleConsistencyCharts.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(mathSrc, /circularStdMinutes|circularMeanMinutes/)
assert.match(chartSrc, /ReferenceArea/)
assert.match(chartSrc, /bandLow|bandHigh|sd/)
assert.match(pageSrc, /BedtimeWakeConsistencyCharts/)

// Identical bedtimes → mean exact, sd 0, zero-width band
const same = [22 * 60, 22 * 60, 22 * 60]
assert.equal(circularMeanMinutes(same), 22 * 60)
assert.equal(circularStdMinutes(same), 0)

// Known spread around 22:00: 21:00, 22:00, 23:00
const spread = [21 * 60, 22 * 60, 23 * 60]
const mean = circularMeanMinutes(spread)
assert.ok(mean != null)
assert.ok(Math.abs(mean - 22 * 60) < 1e-6)
const sd = circularStdMinutes(spread)
// population variance of [-60,0,60] = (3600+0+3600)/3 = 2400 → sd = √2400 ≈ 48.99
assert.ok(Math.abs(sd - Math.sqrt(2400)) < 1e-6)

assert.equal(formatClockMinutes(22 * 60), '22:00')
assert.equal(unwrapToMean(1 * 60, 23 * 60), 25 * 60) // 01:00 near 23:00 mean → +1440

function fakeEntry(day, bedH, bedM) {
  const bed = new Date(2026, 6, day, bedH, bedM)
  return {
    id: `e-${day}`,
    date: `2026-07-${String(day).padStart(2, '0')}T00:00:00.000Z`,
    bedTime: bed.toISOString(),
    attemptSleepTime: null,
    estimatedSleepTime: null,
    wakeTime: new Date(2026, 6, day + 1, 6, 30).toISOString(),
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: 7,
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

const entries = [
  fakeEntry(1, 21, 0),
  fakeEntry(2, 22, 0),
  fakeEntry(3, 23, 0),
]

const series = buildBedtimeConsistencySeries(entries, 14)
assert.ok(series, 'bedtime series')
assert.equal(series.points.length, 3)
assert.ok(Math.abs(series.mean - 22 * 60) < 1e-6)
assert.ok(Math.abs(series.sd - Math.sqrt(2400)) < 1e-6)
assert.ok(Math.abs(series.bandLow - (series.mean - series.sd)) < 1e-9)
assert.ok(Math.abs(series.bandHigh - (series.mean + series.sd)) < 1e-9)

const rows = seriesToChartRows(series)
assert.equal(rows[0].sdLow, series.bandLow)
assert.equal(rows[0].sdHigh, series.bandHigh)
assert.ok(rows.some((r) => r.value !== series.mean), 'daily line drifts from mean')

const html = renderToStaticMarkup(
  createElement(ScheduleConsistencyChart, {
    title: 'Bedtime consistency (14d)',
    series,
    valueName: 'Bedtime',
  })
)
assert.match(html, /Bedtime consistency/)
assert.match(html, /schedule-consistency-chart|bedtime/i)

const pairHtml = renderToStaticMarkup(
  createElement(BedtimeWakeConsistencyCharts, { entries })
)
assert.match(pairHtml, /Bedtime consistency/)
assert.match(pairHtml, /Wake consistency/)

console.log(
  `Schedule consistency OK — mean=${formatClockMinutes(series.mean)} ±${Math.round(series.sd)}m band; daily line plots drift`
)
