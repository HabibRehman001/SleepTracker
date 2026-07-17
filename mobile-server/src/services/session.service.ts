import {
  ACTIVITY_SOURCES,
  ActivitySession,
  type ActivitySource,
} from '../models/ActivitySession'

export type CreateSessionInput = {
  date: Date | string
  bedTime: Date | string
  wakeTime: Date | string
  source: ActivitySource
  stepsCount?: number
  homeArrivalTime?: Date | string | null
}

function parseDate(value: Date | string, field: string): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for ${field}`)
  }
  return d
}

/** Parse range query like 7d | 30d | 90d | all → cutoff Date or null. */
export function rangeCutoff(range: string | undefined): Date | null {
  if (!range || range === 'all') return null
  const match = /^(\d+)d$/i.exec(range.trim())
  if (!match) {
    throw new Error('range must be Nd (e.g. 30d) or all')
  }
  const days = Number(match[1])
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('range days must be a positive number')
  }
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  return cutoff
}

export function assertValidSource(source: unknown): asserts source is ActivitySource {
  if (
    typeof source !== 'string' ||
    !(ACTIVITY_SOURCES as readonly string[]).includes(source)
  ) {
    throw new Error(
      `source must be one of: ${ACTIVITY_SOURCES.join(', ')}`
    )
  }
}

export async function createActivitySession(input: CreateSessionInput) {
  assertValidSource(input.source)
  const date = parseDate(input.date, 'date')
  const bedTime = parseDate(input.bedTime, 'bedTime')
  const wakeTime = parseDate(input.wakeTime, 'wakeTime')

  const homeArrivalTime =
    input.homeArrivalTime == null || input.homeArrivalTime === ''
      ? null
      : parseDate(input.homeArrivalTime, 'homeArrivalTime')

  const doc = await ActivitySession.create({
    date,
    bedTime,
    wakeTime,
    source: input.source,
    stepsCount: input.stepsCount ?? 0,
    homeArrivalTime,
  })
  return doc.toObject()
}

export async function listActivitySessions(range?: string) {
  const cutoff = rangeCutoff(range ?? '30d')
  const filter = cutoff ? { date: { $gte: cutoff } } : {}
  const docs = await ActivitySession.find(filter).sort({ date: -1 }).lean()
  return docs
}
