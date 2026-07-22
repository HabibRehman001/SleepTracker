/**
 * Step 202 — bedtime drift vs locked schedule.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  computeScheduleAdherence,
  differenceInMinutes,
} from '../src/services/scheduleAdherenceMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'src/services/scheduleAdherenceMath.ts'),
  'utf8'
)
const routes = readFileSync(join(root, 'src/routes/stats.routes.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(mathSrc, /differenceInMinutes/)
assert.match(mathSrc, /computeScheduleAdherence|adherenceMinutes/)
assert.match(routes, /\/adherence/)
assert.match(routes, /listScheduleAdherence/)
assert.match(summary, /Step 202|6\.148.*202|adherenceMinutes|schedule adherence/)
assert.ok(pkg.scripts['test:schedule-adherence'])

// Night: locked bedtime 04:00, passive detection fell asleep at 04:40 → +40 drift
const lockedSleep = new Date(2026, 6, 22, 4, 0, 0, 0)
const passiveBed = new Date(2026, 6, 22, 4, 40, 0, 0)

const adherenceMinutes = differenceInMinutes(passiveBed, lockedSleep)
assert.equal(adherenceMinutes, 40)

const viaHelper = computeScheduleAdherence({
  passiveSession: { bedTime: passiveBed },
  lockedSchedule: { sleepTime: '04:00' },
})
assert.equal(viaHelper.adherenceMinutes, 40)

// Same via HH:MM schedule object shape from Step 201 pairing
const night = computeScheduleAdherence({
  passiveSession: { bedTime: passiveBed },
  lockedSchedule: { sleepTime: lockedSleep },
})
assert.equal(night.adherenceMinutes, 40)

// Early bed → negative drift
const early = computeScheduleAdherence({
  passiveSession: { bedTime: new Date(2026, 6, 22, 3, 45, 0, 0) },
  lockedSchedule: { sleepTime: '04:00' },
})
assert.equal(early.adherenceMinutes, -15)

console.log(
  'Schedule adherence OK — passive bed 40 min after locked sleep → +40 drift'
)
