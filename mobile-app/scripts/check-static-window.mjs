/**
 * Step 143 — longest static window (6–8h in night window) contract.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  findLongestStaticWindow,
  isInNightWindow,
  MIN_STATIC_SLEEP_MS,
  NIGHT_WINDOW_END_HOUR,
  NIGHT_WINDOW_START_HOUR,
  synthesizeSamples,
} from '../services/staticWindow.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'services/staticWindow.ts'), 'utf8')

assert.match(src, /findLongestStaticWindow/)
assert.match(src, /STATIC|static/)
assert.match(src, /6|MIN_STATIC_SLEEP/)
assert.match(src, /22|NIGHT_WINDOW_START/)
assert.equal(NIGHT_WINDOW_START_HOUR, 22)
assert.equal(NIGHT_WINDOW_END_HOUR, 20)
assert.equal(MIN_STATIC_SLEEP_MS, 6 * 60 * 60 * 1000)

// Night window: 22:00–20:00 next day (generous for shift workers)
const day = new Date(2026, 6, 20) // local Jul 20 2026
function at(h, m, dayOffset = 0) {
  const d = new Date(day)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

assert.equal(isInNightWindow(at(21, 30)), false) // evening before 22:00
assert.equal(isInNightWindow(at(22, 0)), true)
assert.equal(isInNightWindow(at(4, 15, 1)), true)
assert.equal(isInNightWindow(at(12, 20, 1)), true)
assert.equal(isInNightWindow(at(20, 0, 1)), false)
assert.equal(isInNightWindow(at(20, 30, 1)), false)

const interval = 15 * 60 * 1000

// Shorter 45-minute static block earlier in the evening (TV) — outside night
// window start (21:00–21:45) and far under 6h.
const tvStart = at(21, 0)
const tvEnd = at(21, 45)

// 8-hour(+5m) static block 4:15 AM–12:20 PM (shift-worker sleep)
const sleepStart = at(4, 15, 1)
const sleepEnd = at(12, 20, 1)

const sleepSamples = synthesizeSamples(sleepStart, sleepEnd, interval, true, {
  insideHomeGeofence: true,
})
const tvSamples = synthesizeSamples(tvStart, tvEnd, interval, true, {
  insideHomeGeofence: true,
})
const filler = synthesizeSamples(at(22, 0), at(4, 0, 1), interval, false, {
  insideHomeGeofence: true,
})

const all = [...tvSamples, ...filler, ...sleepSamples]
const win = findLongestStaticWindow(all)

assert.ok(win, 'expected a static sleep window')
assert.equal(win.start.getTime(), sleepStart)
assert.equal(win.end.getTime(), sleepEnd)

const durationH = (win.end.getTime() - win.start.getTime()) / (60 * 60 * 1000)
assert.ok(durationH >= 8 && durationH <= 9, `duration ${durationH}h`)

// TV block alone must not win
const tvOnly = findLongestStaticWindow(tvSamples)
assert.equal(tvOnly, null)

// Empty / no static
assert.equal(findLongestStaticWindow([]), null)
assert.equal(
  findLongestStaticWindow(synthesizeSamples(sleepStart, sleepEnd, interval, false)),
  null
)

console.log(
  'Static window contract OK — 04:15–12:20 sleep wins; 45m evening TV ignored'
)
