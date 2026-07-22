/**
 * Step 204 — Start-of-week summary + Monday notification deep link.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildWeekStartInsight,
  hasPassedWeekStartFire,
  isWeekStartDay,
  nextWeekStartFireAt,
  WEEK_START_DAY,
  WEEK_START_SUMMARY_DEEP_LINK,
  WEEK_START_SUMMARY_NOTIFICATION_ID,
  WEEK_START_SUMMARY_ROUTE,
  WEEK_START_SUMMARY_TYPE,
} from '../services/weekStartSummaryMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(join(root, 'services/weekStartSummaryMath.ts'), 'utf8')
const service = readFileSync(join(root, 'services/weekStartSummary.ts'), 'utf8')
const api = readFileSync(join(root, 'services/weeklyStatsApi.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/week-start-summary.tsx'), 'utf8')
const card = readFileSync(
  join(root, 'components/reports/WeekStartSummaryCard.tsx'),
  'utf8'
)
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const notifScreen = readFileSync(
  join(root, 'app/notification-permission.tsx'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'app/week-start-summary.tsx')))
assert.equal(WEEK_START_DAY, 1)
assert.equal(WEEK_START_SUMMARY_ROUTE, '/week-start-summary')
assert.equal(WEEK_START_SUMMARY_DEEP_LINK, 'sleeplock://week-start-summary')
assert.equal(
  WEEK_START_SUMMARY_NOTIFICATION_ID,
  'sleep-lock-week-start-summary'
)

assert.match(math, /buildWeekStartInsight|nextWeekStartFireAt/)
assert.match(service, /syncWeekStartSummaryNotification/)
assert.match(service, /scheduleNotificationAsync/)
assert.match(service, /WEEK_START_SUMMARY_ROUTE|deepLink/)
assert.match(api, /\/stats\/weekly|fetchWeeklyStats/)
assert.match(screen, /testID=["']week-start-summary-screen["']/)
assert.match(screen, /fetchWeeklyStats|buildWeekStartInsight/)
assert.doesNotMatch(screen, /4:12 AM \(18 min|placeholder bedtime/i)
assert.match(card, /WeekStartSummaryCard|isWeekStartDay/)
assert.match(layout, /week-start-summary/)
assert.match(layout, /addNotificationResponseReceivedListener|isWeekStartSummaryNotificationData/)
assert.match(index, /WeekStartSummaryCard|syncWeekStartSummaryNotification/)
assert.match(notifScreen, /syncWeekStartSummaryNotification/)
assert.match(summary, /Step 204|6\.150.*204|week-start|Start of week/)
assert.ok(pkg.scripts['test:week-start-summary'])

// Sunday evening → next fire Monday 09:00
const sunday = new Date(2026, 6, 26, 20, 0, 0) // Sun Jul 26
assert.equal(sunday.getDay(), 0)
const fire = nextWeekStartFireAt(sunday)
assert.equal(fire.getDay(), 1)
assert.equal(fire.getDate(), 27)
assert.equal(fire.getHours(), 9)

// Advancing clock past week-start → fire has passed (OS would have delivered)
const mondayMorning = new Date(2026, 6, 27, 9, 5, 0)
assert.equal(isWeekStartDay(mondayMorning), true)
assert.equal(hasPassedWeekStartFire(mondayMorning, fire), true)

// After fire time, next schedule is the following Monday
const next = nextWeekStartFireAt(mondayMorning)
assert.equal(next.getDate(), 3) // Aug 3 2026
assert.equal(next.getMonth(), 7)
assert.equal(next.getDay(), 1)

/**
 * Seven passive nights (same spreadsheet spirit as Step 203):
 * locked 04:00; Tue best (0), Sat most drifted (+60).
 * Jul 21 2026 = Tue … Jul 25 = Sat.
 */
const nights = [
  { day: 21, bedM: 0, wakeM: 0, adherence: 0 }, // Tue — best
  { day: 22, bedM: 10, wakeM: 5, adherence: 10 },
  { day: 23, bedM: 20, wakeM: 10, adherence: 20 },
  { day: 24, bedM: 30, wakeM: 15, adherence: 30 },
  { day: 25, bedM: 60, wakeM: 30, adherence: 60 }, // Sat — most drifted
  { day: 26, bedM: 40, wakeM: 20, adherence: 40 },
  { day: 27, bedM: 50, wakeM: 25, adherence: 50 },
].map((row) => ({
  date: new Date(2026, 6, row.day, 0, 0, 0, 0),
  bedTime: new Date(2026, 6, row.day, 4, row.bedM, 0, 0),
  wakeTime: new Date(2026, 6, row.day, 12, row.wakeM, 0, 0),
  durationMinutes: 480 - row.adherence,
  adherenceMinutes: row.adherence,
}))

const insight = buildWeekStartInsight(nights, { avgAdherenceMinutes: 30 })
assert.equal(insight.isPlaceholder, false)
assert.equal(insight.nightCount, 7)
assert.equal(insight.bestNightLabel, 'Tuesday')
assert.equal(insight.mostDriftedNightLabel, 'Saturday')
assert.match(insight.adherencePhrase, /30 min later than scheduled/)
assert.match(insight.body, /Last week: avg bedtime/)
assert.match(insight.body, /best night Tuesday/)
assert.match(insight.body, /most drifted night Saturday/)
assert.notEqual(insight.avgBedTimeLabel, '—')
assert.notEqual(insight.avgWakeTimeLabel, '—')
assert.doesNotMatch(insight.body, /TODO|lorem|placeholder/i)

assert.equal(WEEK_START_SUMMARY_TYPE, 'week-start-summary')

console.log(
  'Week-start summary OK — Monday fire + deep link; 7 passive nights → real Insights copy'
)
