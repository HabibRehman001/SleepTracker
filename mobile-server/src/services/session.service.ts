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

export type UpsertHomeArrivalInput = {
  homeArrivalTime: Date | string
  /** Optional schedule placeholders when creating a stub session. */
  bedTime?: Date | string
  wakeTime?: Date | string
  source?: ActivitySource
}

function parseDate(value: Date | string, field: string): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for ${field}`)
  }
  return d
}

/** Local calendar midnight for the sleep day containing `at` (noon-based). */
export function sleepDayDate(at: Date): Date {
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  day.setHours(0, 0, 0, 0)
  return day
}

/** YYYY-MM-DD for the sleep day containing `at`. */
export function sleepDayDateKey(at: Date): string {
  const d = sleepDayDate(at)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/** Local HH:MM — e.g. 4:30 AM → "04:30". */
export function formatHomeArrivalHHMM(at: Date): string {
  const h = String(at.getHours()).padStart(2, '0')
  const m = String(at.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function sleepDayDateBounds(at: Date): { start: Date; end: Date } {
  const start = sleepDayDate(at)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
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

function parseOptionalHomeArrival(
  value: Date | string | null | undefined
): Date | null {
  if (value == null || value === '') return null
  return parseDate(value, 'homeArrivalTime')
}

/**
 * Create or update the single row for this sleep day × source
 * (Step 201 — passive and locked coexist as separate rows).
 */
export async function createActivitySession(input: CreateSessionInput) {
  assertValidSource(input.source)
  const date = parseDate(input.date, 'date')
  const bedTime = parseDate(input.bedTime, 'bedTime')
  const wakeTime = parseDate(input.wakeTime, 'wakeTime')
  const homeArrivalTime = parseOptionalHomeArrival(input.homeArrivalTime)
  const { start, end } = sleepDayDateBounds(date)

  const existing = await ActivitySession.findOne({
    date: { $gte: start, $lt: end },
    source: input.source,
  })

  if (existing) {
    existing.bedTime = bedTime
    existing.wakeTime = wakeTime
    if (input.stepsCount != null) existing.stepsCount = input.stepsCount
    if (input.homeArrivalTime !== undefined) {
      existing.homeArrivalTime = homeArrivalTime
    }
    await existing.save()
    return existing.toObject()
  }

  const doc = await ActivitySession.create({
    date: sleepDayDate(date),
    bedTime,
    wakeTime,
    source: input.source,
    stepsCount: input.stepsCount ?? 0,
    homeArrivalTime,
  })
  return doc.toObject()
}

/**
 * Step 175 — persist homeArrivalTime on the locked-schedule row for the sleep day.
 * Never mutates passive-ongoing (Step 201 — keep actual vs enforced distinct).
 */
export async function upsertHomeArrivalForSleepDay(
  input: UpsertHomeArrivalInput
) {
  const homeArrivalTime = parseDate(input.homeArrivalTime, 'homeArrivalTime')
  const { start, end } = sleepDayDateBounds(homeArrivalTime)
  const date = sleepDayDate(homeArrivalTime)

  const source: ActivitySource = input.source ?? 'locked-schedule'
  assertValidSource(source)
  // Home arrival is enforcement telemetry — only attach to locked (or explicit) row.
  const targetSource =
    source === 'passive-ongoing' ? 'locked-schedule' : source

  const existing = await ActivitySession.findOne({
    date: { $gte: start, $lt: end },
    source: targetSource,
  }).sort({ updatedAt: -1 })

  if (existing) {
    existing.homeArrivalTime = homeArrivalTime
    if (input.bedTime) existing.bedTime = parseDate(input.bedTime, 'bedTime')
    if (input.wakeTime) existing.wakeTime = parseDate(input.wakeTime, 'wakeTime')
    await existing.save()
    return existing.toObject()
  }

  const bedTime = input.bedTime
    ? parseDate(input.bedTime, 'bedTime')
    : homeArrivalTime
  const wakeTime = input.wakeTime
    ? parseDate(input.wakeTime, 'wakeTime')
    : (() => {
        const w = new Date(homeArrivalTime)
        w.setHours(w.getHours() + 8)
        return w
      })()

  const doc = await ActivitySession.create({
    date,
    bedTime,
    wakeTime,
    source: targetSource,
    stepsCount: 0,
    homeArrivalTime,
  })
  return doc.toObject()
}

/** List sessions; optional source filter (Step 201 — query independently). */
export async function listActivitySessions(
  range?: string,
  source?: ActivitySource | string
) {
  const cutoff = rangeCutoff(range ?? '30d')
  const filter: Record<string, unknown> = {}
  if (cutoff) filter.date = { $gte: cutoff }
  if (source != null && source !== '') {
    assertValidSource(source)
    filter.source = source
  }
  const docs = await ActivitySession.find(filter).sort({ date: -1 }).lean()
  return docs
}
