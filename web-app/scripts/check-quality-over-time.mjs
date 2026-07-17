/**
 * Step 88 — Sleep quality over time: daily faint + 7-day rolling average.
 * Step 94 — rollingAverage edges are NaN until a full window is available.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildQualityOverTimePoints,
  rollingAverage,
  rollingAverageForChart,
  SleepQualityOverTimeChart,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/components/charts/qualityOverTime.ts'),
  'utf8'
)
const utilSrc = readFileSync(
  join(root, 'src/lib/rollingAverage.ts'),
  'utf8'
)
const chartSrc = readFileSync(
  join(root, 'src/components/charts/SleepQualityOverTimeChart.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(mathSrc, /rollingAverage|QUALITY_ROLLING_WINDOW/)
assert.match(utilSrc, /NaN/)
assert.match(utilSrc, /full-window/)
assert.match(chartSrc, /rolling7/)
assert.match(chartSrc, /strokeOpacity/)
assert.match(chartSrc, /name="Daily"/)
assert.match(chartSrc, /name="7-day avg"/)
assert.match(pageSrc, /SleepQualityOverTimeChart/)

// Step 94 — full-window edges
const sample = rollingAverage([1, 2, 3, 4, 5], 3)
assert.ok(Number.isNaN(sample[0]))
assert.ok(Number.isNaN(sample[1]))
assert.deepEqual(sample.slice(2), [2, 3, 4])

const series = [1, 2, 3, 4, 5, 6, 7]
const rolled = rollingAverage(series, 7)
assert.ok(Number.isNaN(rolled[0]))
assert.ok(Number.isNaN(rolled[5]))
assert.equal(rolled[6], 4)

// Chart wrapper: null cold-start + holes → null (not partial means)
assert.deepEqual(rollingAverageForChart([2, null, 4], 3), [null, null, null])

function fakeEntry(day, quality) {
  return {
    id: `q-${day}`,
    date: `2026-06-${String(day).padStart(2, '0')}T00:00:00.000Z`,
    bedTime: null,
    attemptSleepTime: null,
    estimatedSleepTime: null,
    wakeTime: null,
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: quality,
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

const entries = [1, 2, 3, 4, 5, 6, 7, 8].map((d, i) =>
  fakeEntry(d, i + 1)
)
const points = buildQualityOverTimePoints(entries, 60)
assert.equal(points.length, 8)
assert.equal(points[0].quality, 1)
assert.equal(points[7].quality, 8)
assert.equal(points[0].rolling7, null) // warm-up
assert.equal(points[6].rolling7, 4)
assert.ok(points[7].rolling7 != null)

const html = renderToStaticMarkup(
  createElement(SleepQualityOverTimeChart, { entries: [], points })
)
assert.match(html, /Sleep quality over time/)
assert.match(html, /sleep-quality-over-time-chart/)

console.log(
  'Sleep quality over time OK — daily faint + 7-day rolling average overlay'
)
