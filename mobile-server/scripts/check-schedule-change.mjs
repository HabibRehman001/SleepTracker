/**
 * Step 151 — POST /schedule/change-request (24h delay); enforced = old until then.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  computePendingEffectiveAt,
  resolveEnforcedSchedule,
} from '../src/services/scheduleChange.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const routes = readFileSync(join(root, 'src/routes/schedule.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/schedule.service.ts'),
  'utf8'
)
const model = readFileSync(join(root, 'src/models/Schedule.ts'), 'utf8')

assert.match(routes, /change-request/)
assert.match(service, /requestScheduleChange/)
assert.match(service, /SCHEDULE_CHANGE_EFFECT_MESSAGE/)
assert.match(model, /pendingSleepTime|pendingEffectiveAt/)
assert.match(model, /allowCoreUpdate/)

assert.equal(
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  'Your new schedule will take effect in 24 hours'
)

const requestedAt = new Date('2026-07-22T03:00:00.000Z')
const effectiveAt = computePendingEffectiveAt(requestedAt)
const schedule = {
  sleepTime: '04:00',
  wakeTime: '12:00',
  pendingSleepTime: '05:00',
  pendingWakeTime: '11:30',
  pendingEffectiveAt: effectiveAt,
}

const mid = resolveEnforcedSchedule(
  schedule,
  new Date('2026-07-22T15:00:00.000Z')
)
assert.equal(mid.sleepTime, '04:00')
assert.equal(mid.wakeTime, '12:00')

const due = resolveEnforcedSchedule(
  schedule,
  new Date('2026-07-23T03:00:00.000Z')
)
assert.equal(due.sleepTime, '05:00')
assert.equal(due.wakeTime, '11:30')

console.log('Schedule change-request API contract OK — 24h delay')
