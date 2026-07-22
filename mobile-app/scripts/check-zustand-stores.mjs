/**
 * Step 123 — Zustand stores: schedule, baseline, lockState.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useScheduleStore } from '../store/scheduleStore.ts'
import { useBaselineStore } from '../store/baselineStore.ts'
import { useLockStateStore } from '../store/lockStateStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

for (const rel of [
  'store/scheduleStore.ts',
  'store/baselineStore.ts',
  'store/lockStateStore.ts',
]) {
  assert.ok(existsSync(join(root, rel)), rel)
}

const scheduleSrc = readFileSync(join(root, 'store/scheduleStore.ts'), 'utf8')
const baselineSrc = readFileSync(join(root, 'store/baselineStore.ts'), 'utf8')
const lockSrc = readFileSync(join(root, 'store/lockStateStore.ts'), 'utf8')

assert.match(scheduleSrc, /bedtime/)
assert.match(scheduleSrc, /waketime/)
assert.match(scheduleSrc, /lockedIn/)
assert.match(baselineSrc, /avgDailySteps|detectedBedtime/)
assert.match(lockSrc, /isLocked/)

// Runtime: schedule lock-in
useScheduleStore.setState({
  bedtime: null,
  waketime: null,
  lockedIn: false,
  lockedAt: null,
  pendingSleepTime: null,
  pendingWakeTime: null,
  pendingRequestedAt: null,
  pendingEffectiveAt: null,
})
useScheduleStore.getState().setSchedule('23:00', '07:00')
assert.equal(useScheduleStore.getState().bedtime, '23:00')
assert.equal(useScheduleStore.getState().waketime, '07:00')
useScheduleStore.getState().lockIn()
assert.equal(useScheduleStore.getState().lockedIn, true)
assert.ok(useScheduleStore.getState().lockedAt)
useScheduleStore.getState().setSchedule('22:00', '06:00')
assert.equal(useScheduleStore.getState().bedtime, '23:00', 'locked schedule immutable')
useScheduleStore.getState().clearSchedule()
assert.equal(useScheduleStore.getState().lockedIn, true, 'clearSchedule blocked when locked')

// Runtime: baseline
useBaselineStore.getState().resetBaseline()
useBaselineStore.getState().setBaseline({
  avgDailySteps: 7000,
  detectedBedtime: '23:15',
  sampleNights: 2,
})
assert.equal(useBaselineStore.getState().avgDailySteps, 7000)
assert.ok(useBaselineStore.getState().detectedAt)

// Runtime: lock state
useLockStateStore.getState().reset()
useLockStateStore.getState().setLocked(true)
useLockStateStore.getState().setBusy(true)
assert.equal(useLockStateStore.getState().isLocked, true)
assert.equal(useLockStateStore.getState().busy, true)

const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
assert.match(home, /useLockStateStore/)

console.log('Zustand stores contract OK — schedule / baseline / lockState')
