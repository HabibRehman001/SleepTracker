/**
 * Step 151 — delayed schedule change (24h cooling-off). Shared pure helpers.
 */

export const SCHEDULE_CHANGE_DELAY_MS = 24 * 60 * 60 * 1000

export const SCHEDULE_CHANGE_EFFECT_MESSAGE =
  'Your new schedule will take effect in 24 hours'

export type ScheduleTimes = {
  sleepTime: string
  wakeTime: string
}

export type ScheduleWithPending = ScheduleTimes & {
  pendingSleepTime?: string | null
  pendingWakeTime?: string | null
  pendingEffectiveAt?: string | Date | null
  pendingRequestedAt?: string | Date | null
}

export function computePendingEffectiveAt(
  requestedAt: Date = new Date()
): Date {
  return new Date(requestedAt.getTime() + SCHEDULE_CHANGE_DELAY_MS)
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isPendingChangeActive(
  schedule: ScheduleWithPending,
  now: Date = new Date()
): boolean {
  const effectiveAt = toDate(schedule.pendingEffectiveAt ?? null)
  if (!effectiveAt) return false
  if (!schedule.pendingSleepTime || !schedule.pendingWakeTime) return false
  return effectiveAt.getTime() > now.getTime()
}

export function isPendingChangeDue(
  schedule: ScheduleWithPending,
  now: Date = new Date()
): boolean {
  const effectiveAt = toDate(schedule.pendingEffectiveAt ?? null)
  if (!effectiveAt) return false
  if (!schedule.pendingSleepTime || !schedule.pendingWakeTime) return false
  return effectiveAt.getTime() <= now.getTime()
}

export function resolveEnforcedSchedule(
  schedule: ScheduleWithPending,
  now: Date = new Date()
): ScheduleTimes & { fromPending: boolean } {
  if (isPendingChangeDue(schedule, now)) {
    return {
      sleepTime: schedule.pendingSleepTime!,
      wakeTime: schedule.pendingWakeTime!,
      fromPending: true,
    }
  }
  return {
    sleepTime: schedule.sleepTime,
    wakeTime: schedule.wakeTime,
    fromPending: false,
  }
}
