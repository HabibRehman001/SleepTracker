/**
 * Step 84 — Sleep duration bar chart: 30 days, green/yellow/red vs 8h target.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildSleepDurationBars,
  durationTone,
  durationToneFill,
  SLEEP_DURATION_TARGET_HOURS,
  SleepDurationChart,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/components/charts/sleepDuration.ts'),
  'utf8'
)
const chartSrc = readFileSync(
  join(root, 'src/components/charts/SleepDurationChart.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(mathSrc, /SLEEP_DURATION_TARGET_HOURS|durationTone/)
assert.match(chartSrc, /BarChart/)
assert.match(chartSrc, /Cell|durationToneFill/)
assert.match(pageSrc, /SleepDurationChart/)

assert.equal(SLEEP_DURATION_TARGET_HOURS, 8)
assert.equal(durationTone(8), 'green')
assert.equal(durationTone(8.5), 'green')
assert.equal(durationTone(7), 'yellow')
assert.equal(durationTone(6), 'yellow')
assert.equal(durationTone(5.9), 'red')
assert.equal(durationTone(4), 'red')
assert.ok(durationToneFill.green)
assert.ok(durationToneFill.yellow)
assert.ok(durationToneFill.red)

function fakeEntry(day, hours) {
  const start = new Date(2026, 5, day, 0, 0)
  const wake = new Date(start.getTime() + hours * 60 * 60 * 1000)
  return {
    id: `d-${day}`,
    date: `2026-06-${String(day).padStart(2, '0')}T00:00:00.000Z`,
    bedTime: start.toISOString(),
    attemptSleepTime: start.toISOString(),
    estimatedSleepTime: start.toISOString(),
    wakeTime: wake.toISOString(),
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

// 30 nights: mix of green / yellow / red
const entries = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  const hours = i % 3 === 0 ? 8.2 : i % 3 === 1 ? 6.5 : 5
  return fakeEntry(day, hours)
})

const bars = buildSleepDurationBars(entries, 30)
assert.equal(bars.length, 30, '30 bars')
assert.ok(bars.every((b) => b.tone === durationTone(b.hours)))
assert.ok(bars.some((b) => b.tone === 'green'))
assert.ok(bars.some((b) => b.tone === 'yellow'))
assert.ok(bars.some((b) => b.tone === 'red'))

const html = renderToStaticMarkup(
  createElement(SleepDurationChart, {
    entries: [],
    bars,
    title: 'Sleep duration (30d)',
  })
)
assert.match(html, /Sleep duration \(30d\)/)
assert.match(html, /sleep-duration-chart/)

console.log(
  `Sleep duration chart OK — 30 bars; tones green/yellow/red vs ${SLEEP_DURATION_TARGET_HOURS}h`
)
