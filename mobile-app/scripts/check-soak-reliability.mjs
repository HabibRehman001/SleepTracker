/**
 * Step 192 — battery & reliability soak (real devices, ≥3 nights).
 * Contract encodes the protocol; real overnight runs are MANUAL on iOS + Android.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateSoakCampaign,
  evaluateSoakNight,
  SOAK_MANUAL_CHECKLIST,
  SOAK_MIN_REAL_NIGHTS,
  SOAK_OS_THROTTLE_NOTE,
  SOAK_REQUIRED_PLATFORMS,
  SOAK_REQUIRED_STAGES,
  SOAK_RELIABILITY_BODY,
} from '../services/soakReliabilityMath.ts'
import { GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT } from '../services/geofenceBattery.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(join(root, 'services/soakReliabilityMath.ts'), 'utf8')
const io = readFileSync(join(root, 'services/soakReliability.ts'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const scheduled = readFileSync(join(root, 'services/scheduledLock.ts'), 'utf8')
const warn = readFileSync(join(root, 'services/preLockWarning.ts'), 'utf8')
const home = readFileSync(join(root, 'services/homeArrival.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(SOAK_MIN_REAL_NIGHTS, 3)
assert.deepEqual([...SOAK_REQUIRED_PLATFORMS], ['ios', 'android'])
assert.ok(SOAK_REQUIRED_STAGES.includes('arrival'))
assert.ok(SOAK_REQUIRED_STAGES.includes('session_recorded'))
assert.match(SOAK_RELIABILITY_BODY, /3 real nights|at least 3/i)
assert.match(SOAK_OS_THROTTLE_NOTE, /Doze|Background|throttl/i)
assert.ok(SOAK_MANUAL_CHECKLIST.length >= 6)
assert.ok(
  SOAK_MANUAL_CHECKLIST.some((r) => /iPhone|iOS/i.test(r)) &&
    SOAK_MANUAL_CHECKLIST.some((r) => /Android/i.test(r))
)

assert.match(math, /evaluateSoakCampaign|SOAK_MIN_REAL_NIGHTS/)
assert.match(io, /appendSoakStage|SOAK_NIGHTS_STORAGE_KEY/)
assert.match(settings, /settings-soak-reliability|SOAK_RELIABILITY/)
assert.match(settings, /SOAK_MANUAL_CHECKLIST/)
assert.match(scheduled, /appendSoakStageSafe/)
assert.match(warn, /appendSoakStageSafe\('warning'/)
assert.match(home, /appendSoakStageSafe\('arrival'/)
assert.match(summary, /Step 192|6\.139.*192|soak|3\+.*night/i)
assert.ok(pkg.scripts['test:soak-reliability'])

function completeNight(day, platform, drainOk = true) {
  return {
    sleepDayKey: day,
    platform,
    batteryStartPercent: 90,
    batteryEndPercent: drainOk ? 87 : 60,
    events: SOAK_REQUIRED_STAGES.map((stage) => ({
      stage,
      atIso: `${day}T12:00:00.000Z`,
    })),
  }
}

// Incomplete night fails
const incomplete = evaluateSoakNight({
  sleepDayKey: '2026-07-20',
  platform: 'ios',
  events: [{ stage: 'arrival', atIso: '2026-07-20T04:30:00.000Z' }],
})
assert.equal(incomplete.complete, false)
assert.ok(incomplete.missingStages.includes('lock'))

// Duplicate warning fails
const dup = evaluateSoakNight({
  ...completeNight('2026-07-21', 'ios'),
  events: [
    ...completeNight('2026-07-21', 'ios').events,
    { stage: 'warning', atIso: '2026-07-21T04:40:00.000Z' },
  ],
})
assert.equal(dup.complete, false)
assert.ok(dup.duplicateStages.includes('warning'))

// High drain fails (battery reliability)
const drained = evaluateSoakNight(completeNight('2026-07-21', 'android', false))
assert.equal(drained.complete, false)
assert.equal(drained.drainRedFlag, true)

// Campaign not trusted until 3+ complete per platform
const partial = evaluateSoakCampaign([
  completeNight('2026-07-18', 'ios'),
  completeNight('2026-07-19', 'ios'),
  completeNight('2026-07-18', 'android'),
])
assert.equal(partial.trusted, false)
assert.ok(partial.reasons.some((r) => /ios: 2\/3/.test(r)))
assert.ok(partial.reasons.some((r) => /android: 1\/3/.test(r)))

const trusted = evaluateSoakCampaign([
  completeNight('2026-07-18', 'ios'),
  completeNight('2026-07-19', 'ios'),
  completeNight('2026-07-20', 'ios'),
  completeNight('2026-07-18', 'android'),
  completeNight('2026-07-19', 'android'),
  completeNight('2026-07-20', 'android'),
])
assert.equal(trusted.trusted, true)
assert.equal(trusted.completeByPlatform.ios, 3)
assert.equal(trusted.completeByPlatform.android, 3)
assert.equal(trusted.minNights, 3)

assert.equal(GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT, 5)

console.log(
  'Soak reliability OK — protocol ≥3 real nights/platform; sim ≠ trust; Settings checklist'
)
console.log(
  'MANUAL: run Sleep Lock overnight ≥3 nights on physical iOS + Android before trusting.'
)
