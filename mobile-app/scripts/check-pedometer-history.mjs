/**
 * Step 182 — historical step totals via Pedometer.getStepCountAsync.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isFullCalendarDaySpan,
  isPlausibleWholeDayTotal,
  localDayBounds,
  PLAUSIBLE_SESSION_ONLY_MAX,
  yesterdayBounds,
} from '../services/pedometerMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pedometer = readFileSync(join(root, 'services/pedometer.ts'), 'utf8')
const math = readFileSync(join(root, 'services/pedometerMath.ts'), 'utf8')
const store = readFileSync(join(root, 'store/pedometerStore.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/live-steps.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(pedometer, /Pedometer\.getStepCountAsync/)
assert.match(pedometer, /getYesterdayStepCount|getHistoricalDaySteps/)
assert.match(math, /yesterdayBounds|localDayBounds/)
assert.match(math, /isPlausibleWholeDayTotal|isFullCalendarDaySpan/)
assert.match(store, /yesterdaySteps|refreshHistoricalSteps/)
assert.match(screen, /live-steps-yesterday|live-steps-history/)
assert.match(screen, /PEDOMETER_HISTORY_PURPOSE|getStepCountAsync|yesterday/i)
assert.match(summary, /Step 182|6\.131.*182|getStepCountAsync|yesterday/)
assert.ok(pkg.scripts['test:pedometer-history'])

const now = new Date(2026, 6, 22, 15, 30, 0) // Wed Jul 22 2026 15:30
const y = yesterdayBounds(now)
assert.equal(y.start.getFullYear(), 2026)
assert.equal(y.start.getMonth(), 6)
assert.equal(y.start.getDate(), 21)
assert.equal(y.start.getHours(), 0)
assert.equal(y.end.getDate(), 22)
assert.equal(y.end.getHours(), 0)
assert.ok(isFullCalendarDaySpan(y.start, y.end), 'yesterday is a full calendar day')

const today = localDayBounds(0, now)
assert.equal(today.start.getDate(), 22)
assert.ok(today.end.getTime() <= now.getTime())
assert.ok(today.end.getTime() - today.start.getTime() < 24 * 60 * 60 * 1000)

// Plausible whole-day vs session-only
assert.equal(isPlausibleWholeDayTotal(0), true)
assert.equal(isPlausibleWholeDayTotal(4200), true)
assert.equal(isPlausibleWholeDayTotal(PLAUSIBLE_SESSION_ONLY_MAX), true)
assert.equal(isPlausibleWholeDayTotal(20), false) // looks like a short walk session
assert.equal(isPlausibleWholeDayTotal(null), false)

// Historical API must use getStepCountAsync date range — not watchStepCount alone
assert.match(pedometer, /getStepCountAsync\(start,\s*end\)|getStepCountAsync\(start/)
assert.doesNotMatch(
  pedometer.slice(pedometer.indexOf('getHistoricalDaySteps')),
  /watchStepCount/
)

console.log(
  'Pedometer history contract OK — getStepCountAsync full-day yesterday window'
)
