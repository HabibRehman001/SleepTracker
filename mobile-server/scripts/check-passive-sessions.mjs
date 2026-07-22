/**
 * Step 201 — passive-ongoing vs locked-schedule as distinct records.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ACTIVITY_SOURCES } from '../src/models/ActivitySession.ts'
import {
  ACTIVITY_SOURCE_LOCKED,
  ACTIVITY_SOURCE_PASSIVE,
  buildLockedScheduleSession,
  buildPassiveOngoingSession,
  filterSessionsBySource,
  sameNightDualSources,
  sleepDayKey,
} from '../src/services/passiveSessionMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const activitySrc = readFileSync(
  join(root, 'src/models/ActivitySession.ts'),
  'utf8'
)
const routes = readFileSync(join(root, 'src/routes/session.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/session.service.ts'),
  'utf8'
)
const continuous = readFileSync(
  join(root, '..', 'mobile-app/services/continuousDetection.ts'),
  'utf8'
)
const sessionApi = readFileSync(
  join(root, '..', 'mobile-app/services/sessionApi.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.deepEqual(
  [...ACTIVITY_SOURCES],
  ['baseline-auto', 'locked-schedule', 'passive-ongoing']
)
assert.match(activitySrc, /passive-ongoing/)
assert.match(activitySrc, /unique:\s*true/)
assert.match(routes, /source/)
assert.match(routes, /listActivitySessions\(range,\s*sourceParam\)/)
assert.match(service, /filter\.source|source: input\.source/)
assert.match(service, /passive-ongoing|locked-schedule/)
assert.match(continuous, /pushPassiveOngoingSession|passive-ongoing/)
assert.match(sessionApi, /PASSIVE_ONGOING|passive-ongoing/)
assert.match(sessionApi, /listActivitySessions/)
assert.match(summary, /Step 201|6\.147.*201|passive-ongoing/)
assert.ok(pkg.scripts['test:passive-sessions'])

// Synthetic same night: detected times ≠ enforced times
const day = new Date(2026, 6, 22, 12, 0, 0, 0)
const detectedBed = new Date(2026, 6, 22, 1, 45, 0, 0)
const detectedWake = new Date(2026, 6, 22, 10, 20, 0, 0)
const enforcedBed = new Date(2026, 6, 22, 0, 0, 0, 0)
const enforcedWake = new Date(2026, 6, 22, 8, 0, 0, 0)
const arrival = new Date(2026, 6, 22, 0, 15, 0, 0)

const passive = buildPassiveOngoingSession({
  bedTime: detectedBed,
  wakeTime: detectedWake,
})
const locked = buildLockedScheduleSession({
  bedTime: enforcedBed,
  wakeTime: enforcedWake,
  homeArrivalTime: arrival,
})

assert.equal(passive.source, ACTIVITY_SOURCE_PASSIVE)
assert.equal(locked.source, ACTIVITY_SOURCE_LOCKED)
assert.equal(passive.bedTime.getTime(), detectedBed.getTime())
assert.equal(locked.bedTime.getTime(), enforcedBed.getTime())
assert.notEqual(passive.bedTime.getTime(), locked.bedTime.getTime())
assert.notEqual(passive.wakeTime.getTime(), locked.wakeTime.getTime())

const backendRows = [passive, locked]
const key = sleepDayKey(detectedBed)
const dual = sameNightDualSources({ sessions: backendRows, sleepDayKey: key })
assert.equal(dual.ok, true)
assert.ok(dual.passive)
assert.ok(dual.locked)
assert.equal(dual.passive.source, 'passive-ongoing')
assert.equal(dual.locked.source, 'locked-schedule')

// Queryable independently
const onlyPassive = filterSessionsBySource(backendRows, 'passive-ongoing')
const onlyLocked = filterSessionsBySource(backendRows, 'locked-schedule')
assert.equal(onlyPassive.length, 1)
assert.equal(onlyLocked.length, 1)
assert.equal(onlyPassive[0].wakeTime.getTime(), detectedWake.getTime())
assert.equal(onlyLocked[0].wakeTime.getTime(), enforcedWake.getTime())

console.log(
  'Passive sessions OK — same night has passive-ongoing + locked-schedule, queryable apart'
)
