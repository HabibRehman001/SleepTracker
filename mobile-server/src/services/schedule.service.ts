import { Schedule } from '../models/Schedule'
import {
  computePendingEffectiveAt,
  isPendingChangeActive,
  isPendingChangeDue,
  resolveEnforcedSchedule,
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
} from './scheduleChange'

const CLOCK_HM = /^([01]\d|2[0-3]):[0-5]\d$/

export class ScheduleConflictError extends Error {
  status = 409 as const

  constructor(message = 'Schedule already locked') {
    super(message)
    this.name = 'ScheduleConflictError'
  }
}

export class ScheduleNotFoundError extends Error {
  status = 404 as const

  constructor(message = 'No schedule set yet') {
    super(message)
    this.name = 'ScheduleNotFoundError'
  }
}

export type CreateScheduleInput = {
  sleepTime: string
  wakeTime: string
  lockedAt?: Date | string | null
}

export type RequestScheduleChangeInput = {
  sleepTime: string
  wakeTime: string
}

function assertClockHm(value: unknown, field: string): string {
  if (typeof value !== 'string' || !CLOCK_HM.test(value)) {
    throw new Error(`${field} must be HH:MM (24h)`)
  }
  return value
}

function serializeSchedule(doc: {
  toObject: (opts?: object) => Record<string, unknown>
} | Record<string, unknown>) {
  const raw =
    typeof (doc as { toObject?: unknown }).toObject === 'function'
      ? (doc as { toObject: (o?: object) => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>)

  const sleepTime = String(raw.sleepTime)
  const wakeTime = String(raw.wakeTime)
  const pending = {
    sleepTime,
    wakeTime,
    pendingSleepTime: (raw.pendingSleepTime as string | null) ?? null,
    pendingWakeTime: (raw.pendingWakeTime as string | null) ?? null,
    pendingEffectiveAt: raw.pendingEffectiveAt ?? null,
    pendingRequestedAt: raw.pendingRequestedAt ?? null,
  }
  const enforced = resolveEnforcedSchedule(pending)
  return {
    ...raw,
    sleepTime,
    wakeTime,
    enforcedSleepTime: enforced.sleepTime,
    enforcedWakeTime: enforced.wakeTime,
    pendingActive: isPendingChangeActive(pending),
    changeEffectMessage: isPendingChangeActive(pending)
      ? SCHEDULE_CHANGE_EFFECT_MESSAGE
      : null,
  }
}

/**
 * Create the single app schedule. Second create → 409 (Step 128 / 150).
 */
export async function createSchedule(input: CreateScheduleInput) {
  const existing = await Schedule.findOne().lean()
  if (existing) {
    throw new ScheduleConflictError('Schedule already locked')
  }

  const sleepTime = assertClockHm(input.sleepTime, 'sleepTime')
  const wakeTime = assertClockHm(input.wakeTime, 'wakeTime')
  const lockedAt =
    input.lockedAt == null
      ? new Date()
      : input.lockedAt instanceof Date
        ? input.lockedAt
        : new Date(input.lockedAt)

  if (Number.isNaN(lockedAt.getTime())) {
    throw new Error('lockedAt must be a valid date')
  }

  const doc = await Schedule.create({
    sleepTime,
    wakeTime,
    lockedAt,
  })
  return serializeSchedule(doc)
}

/** Promote due pending change onto core sleep/wake (old stays until then). */
async function applyDuePendingIfNeeded() {
  const doc = await Schedule.findOne()
  if (!doc) return null
  const snapshot = {
    sleepTime: doc.sleepTime,
    wakeTime: doc.wakeTime,
    pendingSleepTime: doc.pendingSleepTime,
    pendingWakeTime: doc.pendingWakeTime,
    pendingEffectiveAt: doc.pendingEffectiveAt,
  }
  if (!isPendingChangeDue(snapshot)) return doc

  ;(doc as { $locals: { allowCoreUpdate?: boolean } }).$locals = {
    allowCoreUpdate: true,
  }
  doc.sleepTime = doc.pendingSleepTime!
  doc.wakeTime = doc.pendingWakeTime!
  doc.lockedAt = new Date()
  doc.pendingSleepTime = null
  doc.pendingWakeTime = null
  doc.pendingRequestedAt = null
  doc.pendingEffectiveAt = null
  await doc.save()
  return doc
}

export async function getSchedule() {
  const doc = await applyDuePendingIfNeeded()
  if (!doc) {
    throw new ScheduleNotFoundError()
  }
  return serializeSchedule(doc)
}

/**
 * Step 151 — request a delayed change. Current schedule stays enforced for 24h.
 */
export async function requestScheduleChange(input: RequestScheduleChangeInput) {
  const sleepTime = assertClockHm(input.sleepTime, 'sleepTime')
  const wakeTime = assertClockHm(input.wakeTime, 'wakeTime')

  let doc = await applyDuePendingIfNeeded()
  if (!doc) {
    throw new ScheduleNotFoundError()
  }

  const snapshot = {
    sleepTime: doc.sleepTime,
    wakeTime: doc.wakeTime,
    pendingSleepTime: doc.pendingSleepTime,
    pendingWakeTime: doc.pendingWakeTime,
    pendingEffectiveAt: doc.pendingEffectiveAt,
  }
  if (isPendingChangeActive(snapshot)) {
    throw new ScheduleConflictError(
      'A schedule change is already pending — wait for it to take effect'
    )
  }

  if (sleepTime === doc.sleepTime && wakeTime === doc.wakeTime) {
    throw new Error('New schedule must differ from the current locked schedule')
  }

  const requestedAt = new Date()
  const effectiveAt = computePendingEffectiveAt(requestedAt)

  doc.pendingSleepTime = sleepTime
  doc.pendingWakeTime = wakeTime
  doc.pendingRequestedAt = requestedAt
  doc.pendingEffectiveAt = effectiveAt
  await doc.save()

  return {
    ...serializeSchedule(doc),
    message: SCHEDULE_CHANGE_EFFECT_MESSAGE,
  }
}

export { SCHEDULE_CHANGE_EFFECT_MESSAGE, resolveEnforcedSchedule }
