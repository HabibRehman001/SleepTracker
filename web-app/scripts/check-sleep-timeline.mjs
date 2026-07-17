/**
 * Step 82 — Sleep timeline: noon-based sleep day; 4 AM–12 PM is one continuous bar.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildSleepTimelineRows,
  formatSleepDayTick,
  sleepDayNoonAnchor,
  SleepTimelineChart,
  sleepSpanOnSleepDay,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const timelineSrc = readFileSync(
  join(root, 'src/components/charts/sleepTimeline.ts'),
  'utf8'
)
const chartSrc = readFileSync(
  join(root, 'src/components/charts/SleepTimelineChart.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(timelineSrc, /sleepDayNoonAnchor|SLEEP_DAY_MINUTES/)
assert.match(chartSrc, /layout="vertical"/)
assert.match(chartSrc, /stackId/)
assert.match(pageSrc, /SleepTimelineChart/)

// 4 AM → 12 PM same calendar morning (crosses midnight from prior noon axis)
const bed = new Date(2026, 6, 2, 4, 0) // Thu 4:00
const wake = new Date(2026, 6, 2, 12, 0) // Thu 12:00
const anchor = sleepDayNoonAnchor(bed)
assert.equal(anchor.getHours(), 12)
assert.equal(anchor.getDate(), 1) // Wed noon

const span = sleepSpanOnSleepDay(bed, wake)
assert.ok(span, 'span computed')
assert.equal(span.startOffset, 16 * 60, '4 AM = 960m from noon')
assert.equal(span.endOffset, 24 * 60, '12 PM = 1440m from noon')
assert.equal(span.duration, 8 * 60, '8h continuous')
assert.ok(
  span.endOffset > span.startOffset,
  'single continuous interval (not split at midnight)'
)
// Must NOT be two pieces around midnight (0 and 720)
assert.notEqual(span.startOffset, 0)
assert.ok(span.startOffset > 12 * 60, 'starts after midnight on the sleep-day axis')

assert.equal(formatSleepDayTick(960), '04:00')
assert.equal(formatSleepDayTick(1440), '12:00')
assert.equal(formatSleepDayTick(0), '12:00')
assert.equal(formatSleepDayTick(720), '00:00')

const overnight = sleepSpanOnSleepDay(
  new Date(2026, 6, 1, 23, 0),
  new Date(2026, 6, 2, 7, 0)
)
assert.ok(overnight)
assert.equal(overnight.startOffset, 11 * 60)
assert.equal(overnight.endOffset, 19 * 60)
assert.equal(overnight.duration, 8 * 60)

const entry = {
  id: 'n1',
  date: '2026-07-02T00:00:00.000Z',
  bedTime: bed.toISOString(),
  attemptSleepTime: bed.toISOString(),
  estimatedSleepTime: bed.toISOString(),
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

const rows = buildSleepTimelineRows([entry])
assert.equal(rows.length, 1)
assert.equal(rows[0].pad, 960)
assert.equal(rows[0].sleep, 480)
assert.equal(rows[0].startOffset, 960)
assert.equal(rows[0].endOffset, 1440)

const html = renderToStaticMarkup(
  createElement(SleepTimelineChart, {
    entries: [],
    rows,
    title: 'Sleep timeline',
  })
)
assert.match(html, /Sleep timeline/)
assert.match(html, /sleep-timeline-chart/)

console.log(
  'Sleep timeline OK — 4 AM–12 PM → continuous bar [960, 1440] on noon sleep-day axis'
)
