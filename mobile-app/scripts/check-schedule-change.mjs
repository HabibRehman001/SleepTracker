/**
 * Step 151 — 24h delayed schedule change; old schedule stays enforced.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SCHEDULE_CHANGE_DELAY_MS,
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  computePendingEffectiveAt,
  isPendingChangeActive,
  resolveEnforcedSchedule,
} from '../services/scheduleChange.ts'
import { useScheduleStore } from '../store/scheduleStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

assert.ok(existsSync(join(root, 'app/request-schedule-change.tsx')))
assert.ok(existsSync(join(root, 'services/scheduleChange.ts')))

const screen = readFileSync(
  join(root, 'app/request-schedule-change.tsx'),
  'utf8'
)
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const api = readFileSync(join(root, 'services/scheduleApi.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')

assert.equal(
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  'Your new schedule will take effect in 24 hours'
)
assert.equal(SCHEDULE_CHANGE_DELAY_MS, 24 * 60 * 60 * 1000)

assert.match(screen, /Your new schedule will take effect in 24 hours|SCHEDULE_CHANGE_EFFECT_MESSAGE/)
assert.match(screen, /request-change-effect-message|request-change-enforced/)
assert.match(settings, /request-schedule-change|settings-request-change/)
assert.match(settings, /SCHEDULE_CHANGE_EFFECT_MESSAGE|settings-change-effect-message/)
assert.match(api, /change-request|requestScheduleChange/)
assert.match(layout, /request-schedule-change/)

const requestedAt = new Date('2026-07-22T03:00:00.000Z')
const effectiveAt = computePendingEffectiveAt(requestedAt)
assert.equal(
  effectiveAt.toISOString(),
  '2026-07-23T03:00:00.000Z'
)

const schedule = {
  sleepTime: '04:00',
  wakeTime: '12:00',
  pendingSleepTime: '05:00',
  pendingWakeTime: '11:30',
  pendingEffectiveAt: effectiveAt.toISOString(),
}

// During the delay: old schedule stays enforced
const during = resolveEnforcedSchedule(schedule, new Date('2026-07-22T12:00:00.000Z'))
assert.equal(during.sleepTime, '04:00')
assert.equal(during.wakeTime, '12:00')
assert.equal(during.fromPending, false)
assert.equal(isPendingChangeActive(schedule, new Date('2026-07-22T12:00:00.000Z')), true)

// After 24h: pending becomes enforced
const after = resolveEnforcedSchedule(schedule, new Date('2026-07-23T03:00:00.000Z'))
assert.equal(after.sleepTime, '05:00')
assert.equal(after.wakeTime, '11:30')
assert.equal(after.fromPending, true)

// Store: pending does not rewrite bedtime until due
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
useScheduleStore.getState().applyLockedSchedule('04:00', '12:00', requestedAt)
useScheduleStore
  .getState()
  .applyPendingChange('05:00', '11:30', effectiveAt, requestedAt)
assert.equal(useScheduleStore.getState().bedtime, '04:00')
assert.equal(useScheduleStore.getState().waketime, '12:00')
const enforced = useScheduleStore
  .getState()
  .getEnforcedTimes(new Date('2026-07-22T12:00:00.000Z'))
assert.deepEqual(enforced, { bedtime: '04:00', waketime: '12:00' })
assert.equal(
  useScheduleStore.getState().promoteDuePending(new Date('2026-07-22T12:00:00.000Z')),
  false
)
assert.equal(
  useScheduleStore.getState().promoteDuePending(new Date('2026-07-23T04:00:00.000Z')),
  true
)
assert.equal(useScheduleStore.getState().bedtime, '05:00')
assert.equal(useScheduleStore.getState().waketime, '11:30')
assert.equal(useScheduleStore.getState().pendingSleepTime, null)

console.log(
  'Schedule change delay contract OK — 24h message + old schedule enforced'
)
