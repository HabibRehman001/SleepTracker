/**
 * Step 191 — full nightly cycle e2e with sped-up clock.
 * arrival → 30-min warning → lock → stay locked → unlock → session recorded.
 * Each stage fires exactly once (no duplicate notifications / double-locks).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertNightlyCycleOnceEach,
  simulateNightlyCycle,
} from '../services/nightlyCycleMath.ts'
import { GRACE_MINUTES } from '../services/lateArrivalMath.ts'
import { LOCK_WARNING_MINUTES } from '../services/preLockWarningMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(join(root, 'services/nightlyCycleMath.ts'), 'utf8')
const scheduled = readFileSync(join(root, 'services/scheduledLock.ts'), 'utf8')
const sessionApi = readFileSync(join(root, 'services/sessionApi.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(math, /simulateNightlyCycle|assertNightlyCycleOnceEach/)
assert.match(math, /arrival|warning|lock|unlock|session_recorded/)
assert.match(scheduled, /finalizeLockedNightToBackend|LOCK_STARTED_AT/)
assert.match(sessionApi, /finalizeLockedNightToBackend/)
assert.match(summary, /Step 191|6\.138.*191|nightly cycle/)
assert.ok(pkg.scripts['test:nightly-cycle'])

assert.equal(GRACE_MINUTES, 30)
assert.equal(LOCK_WARNING_MINUTES, 30)

function at(h, m, day = 22) {
  return new Date(2026, 6, day, h, m, 0, 0)
}

// Classic late-arrival night: sleep 04:00, arrive 04:30 → warn 04:30, lock 05:00, wake 12:00
const result = await simulateNightlyCycle({
  start: at(4, 0),
  end: at(12, 10),
  tickMinutes: 5,
  sleepTime: '04:00',
  wakeTime: '12:00',
  arrivalAt: at(4, 30),
})

assertNightlyCycleOnceEach(result)

assert.equal(result.counts.arrival, 1)
assert.equal(result.counts.warning, 1)
assert.equal(result.counts.lock, 1)
assert.equal(result.counts.unlock, 1)
assert.equal(result.counts.sessionRecorded, 1)
assert.ok(result.counts.stayLockedTicks >= 1)

const stages = result.events.map((e) => e.stage)
assert.ok(stages.indexOf('arrival') < stages.indexOf('warning'))
assert.ok(stages.indexOf('warning') < stages.indexOf('lock'))
assert.ok(stages.indexOf('lock') < stages.indexOf('stay_locked'))
assert.ok(stages.indexOf('stay_locked') < stages.indexOf('unlock'))
assert.ok(stages.indexOf('unlock') < stages.indexOf('session_recorded'))

assert.ok(result.lockedAt)
assert.equal(result.lockedAt.getHours(), 5)
assert.equal(result.lockedAt.getMinutes(), 0)
assert.ok(result.unlockedAt)
assert.ok(result.unlockedAt.getHours() >= 12)
assert.ok(result.session)
assert.equal(result.session.source, 'locked-schedule')
assert.equal(result.session.bedTime.getHours(), 5)
assert.equal(result.session.homeArrivalTime.getHours(), 4)
assert.equal(result.session.homeArrivalTime.getMinutes(), 30)

// No duplicate notifications / double-locks across the whole sped-up night
assert.equal(
  result.events.filter((e) => e.stage === 'warning').length,
  1,
  'duplicate warning'
)
assert.equal(
  result.events.filter((e) => e.stage === 'lock').length,
  1,
  'double-lock'
)
assert.equal(
  result.events.filter((e) => e.stage === 'unlock').length,
  1,
  'double-unlock'
)
assert.equal(
  result.events.filter((e) => e.stage === 'session_recorded').length,
  1,
  'duplicate session'
)

console.log(
  `Nightly cycle OK — ${result.ticks} ticks @5m; arrival→warn→lock→stay×${result.counts.stayLockedTicks}→unlock→session (each ×1)`
)
