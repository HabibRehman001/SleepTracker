import { Schedule } from '../models/Schedule'

const CLOCK_HM = /^([01]\d|2[0-3]):[0-5]\d$/

export class ScheduleConflictError extends Error {
  status = 409 as const

  constructor(message = 'Schedule already exists') {
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
  /** When true (default), sets lockedAt now — Step 150 immutability. */
  lock?: boolean
}

function assertClockHm(value: unknown, field: string): string {
  if (typeof value !== 'string' || !CLOCK_HM.test(value)) {
    throw new Error(`${field} must be HH:MM (24h)`)
  }
  return value
}

/**
 * Create the single app schedule. Second create → 409 (Step 128 / 150).
 */
export async function createSchedule(input: CreateScheduleInput) {
  const existing = await Schedule.findOne().lean()
  if (existing) {
    throw new ScheduleConflictError(
      'Schedule already exists — POST /schedule is only allowed once (Step 150)'
    )
  }

  const sleepTime = assertClockHm(input.sleepTime, 'sleepTime')
  const wakeTime = assertClockHm(input.wakeTime, 'wakeTime')
  const lock = input.lock !== false

  const doc = await Schedule.create({
    sleepTime,
    wakeTime,
    lockedAt: lock ? new Date() : null,
  })
  return doc.toObject()
}

export async function getSchedule() {
  const doc = await Schedule.findOne().lean()
  if (!doc) {
    throw new ScheduleNotFoundError()
  }
  return doc
}
