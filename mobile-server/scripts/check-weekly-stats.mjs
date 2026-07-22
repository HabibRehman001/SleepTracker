/**
 * Step 203 — weekly aggregation from 7 passive nights (spreadsheet check).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildWeeklyStats,
  durationMinutes,
  WEEKLY_STATS_DAYS,
} from '../src/services/weeklyStatsMath.ts'
import { differenceInMinutes } from '../src/services/scheduleAdherenceMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/services/weeklyStatsMath.ts'),
  'utf8'
)
const service = readFileSync(
  join(root, 'src/services/weeklyStats.service.ts'),
  'utf8'
)
const routes = readFileSync(join(root, 'src/routes/stats.routes.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(WEEKLY_STATS_DAYS, 7)
assert.match(mathSrc, /buildWeeklyStats|passive-ongoing/)
assert.match(service, /aggregateWeeklyStats|passive-ongoing/)
assert.match(service, /ActivitySession\.find/)
assert.doesNotMatch(service, /avgDurationMinutes:\s*\d+|hardcoded/)
assert.match(routes, /\/weekly/)
assert.match(routes, /aggregateWeeklyStats/)
assert.match(summary, /Step 203|6\.149.*203|stats\/weekly|weekly/)
assert.ok(pkg.scripts['test:weekly-stats'])

/**
 * Spreadsheet (locked sleep 04:00):
 * Day | bed   | wake  | duration | adherence
 * 1   | 04:00 | 12:00 | 480      | 0
 * 2   | 04:10 | 12:05 | 475      | 10
 * 3   | 04:20 | 12:10 | 470      | 20
 * 4   | 04:30 | 12:15 | 465      | 30
 * 5   | 04:40 | 12:20 | 460      | 40
 * 6   | 04:50 | 12:25 | 455      | 50
 * 7   | 05:00 | 12:30 | 450      | 60
 * avg duration  = (480+475+470+465+460+455+450)/7 = 465
 * avg adherence = (0+10+20+30+40+50+60)/7 = 30
 */
const lockedSleep = '04:00'
const now = new Date(2026, 6, 28, 15, 0, 0, 0) // Tue Jul 28 → window Jul 22–28

const sheet = [
  { day: 22, bedH: 4, bedM: 0, wakeH: 12, wakeM: 0 },
  { day: 23, bedH: 4, bedM: 10, wakeH: 12, wakeM: 5 },
  { day: 24, bedH: 4, bedM: 20, wakeH: 12, wakeM: 10 },
  { day: 25, bedH: 4, bedM: 30, wakeH: 12, wakeM: 15 },
  { day: 26, bedH: 4, bedM: 40, wakeH: 12, wakeM: 20 },
  { day: 27, bedH: 4, bedM: 50, wakeH: 12, wakeM: 25 },
  { day: 28, bedH: 5, bedM: 0, wakeH: 12, wakeM: 30 },
]

const sessions = sheet.map((row) => {
  const date = new Date(2026, 6, row.day, 0, 0, 0, 0)
  const bedTime = new Date(2026, 6, row.day, row.bedH, row.bedM, 0, 0)
  const wakeTime = new Date(2026, 6, row.day, row.wakeH, row.wakeM, 0, 0)
  return {
    date,
    bedTime,
    wakeTime,
    source: 'passive-ongoing',
  }
})

// Manual spreadsheet columns
const lockedAt = (day, h, m) => new Date(2026, 6, day, h, m, 0, 0)
const manualDurations = sessions.map((s) =>
  durationMinutes(s.bedTime, s.wakeTime)
)
const manualAdherence = sessions.map((s, i) =>
  differenceInMinutes(
    s.bedTime,
    lockedAt(sheet[i].day, 4, 0)
  )
)

assert.deepEqual(manualDurations, [480, 475, 470, 465, 460, 455, 450])
assert.deepEqual(manualAdherence, [0, 10, 20, 30, 40, 50, 60])

const manualAvgDuration = Math.round(
  manualDurations.reduce((a, b) => a + b, 0) / 7
)
const manualAvgAdherence = Math.round(
  manualAdherence.reduce((a, b) => a + b, 0) / 7
)
assert.equal(manualAvgDuration, 465)
assert.equal(manualAvgAdherence, 30)

const weekly = buildWeeklyStats({
  sessions,
  lockedSleepTime: lockedSleep,
  now,
  days: 7,
})

assert.equal(weekly.nightCount, 7)
assert.equal(weekly.nights.length, 7)
assert.equal(weekly.avgDurationMinutes, manualAvgDuration)
assert.equal(weekly.avgAdherenceMinutes, manualAvgAdherence)

for (let i = 0; i < 7; i++) {
  assert.equal(weekly.nights[i].durationMinutes, manualDurations[i])
  assert.equal(weekly.nights[i].adherenceMinutes, manualAdherence[i])
  assert.ok(weekly.nights[i].bedTime)
  assert.ok(weekly.nights[i].wakeTime)
}

// locked-schedule rows must not pollute averages
const withLockedNoise = buildWeeklyStats({
  sessions: [
    ...sessions,
    {
      date: new Date(2026, 6, 25, 0, 0, 0, 0),
      bedTime: new Date(2026, 6, 25, 0, 0, 0, 0),
      wakeTime: new Date(2026, 6, 25, 8, 0, 0, 0),
      source: 'locked-schedule',
    },
  ],
  lockedSleepTime: lockedSleep,
  now,
  days: 7,
})
assert.equal(withLockedNoise.nightCount, 7)
assert.equal(withLockedNoise.avgDurationMinutes, 465)

console.log(
  'Weekly stats OK — 7 passive nights → avg duration 465, avg adherence +30 (spreadsheet match)'
)
