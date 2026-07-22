/**
 * Step 189 — map ActivitySession → Phase 1 Step 105 JSON export shape
 * ({ format, exportedAt, entryCount, entries[] }) so Phase 1 can import later.
 */

export type ActivitySessionForExport = {
  _id?: { toString(): string } | string
  id?: string
  date: Date | string
  bedTime: Date | string
  wakeTime: Date | string
  source?: string
  stepsCount?: number | null
  homeArrivalTime?: Date | string | null
  updatedAt?: Date | string
}

/** Nested entry shape matching Backend SleepEntryWithRelations (null children OK). */
export type Phase1SleepEntryExport = {
  id: string
  date: Date
  bedTime: Date | null
  attemptSleepTime: Date | null
  estimatedSleepTime: Date | null
  wakeTime: Date | null
  outOfBedTime: Date | null
  numberOfAwakenings: number | null
  sleepQuality: number | null
  energyMorning: number | null
  energyWork: number | null
  notes: string | null
  mood: null
  food: null
  exercise: null
  environment: null
  health: null
}

/** Wire / file shape for GET /export/json — same as Phase 1 Step 105. */
export type Phase1JsonExport = {
  format: 'json'
  exportedAt: string
  entryCount: number
  entries: Phase1SleepEntryExport[]
  /** Extra provenance; Phase 1 importer ignores unknown top-level keys. */
  origin?: 'mobile-server'
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** UTC calendar month key yyyy-MM (matches mobile monthly stats). */
export function utcMonthKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** UTC calendar day yyyy-MM-dd. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function filterSessionsByMonth<T extends { date: Date | string }>(
  sessions: T[],
  month?: string
): T[] {
  if (!month) return sessions
  return sessions.filter((s) => {
    const d = asDate(s.date)
    return d != null && utcMonthKeyFromDate(d) === month
  })
}

/**
 * One Phase 1 entry per calendar day — prefer locked-schedule, then newest.
 * Phase 1 upserts by date; duplicate days would overwrite on import.
 */
export function collapseSessionsByDate(
  sessions: ActivitySessionForExport[]
): ActivitySessionForExport[] {
  const byDay = new Map<string, ActivitySessionForExport>()

  for (const session of sessions) {
    const d = asDate(session.date)
    if (!d) continue
    const key = utcDateKey(d)
    const existing = byDay.get(key)
    if (!existing) {
      byDay.set(key, session)
      continue
    }
    const preferNew =
      session.source === 'locked-schedule' &&
      existing.source !== 'locked-schedule'
    if (preferNew) {
      byDay.set(key, session)
      continue
    }
    if (
      existing.source === 'locked-schedule' &&
      session.source !== 'locked-schedule'
    ) {
      continue
    }
    const existingTs = asDate(existing.updatedAt)?.getTime() ?? 0
    const nextTs = asDate(session.updatedAt)?.getTime() ?? 0
    if (nextTs >= existingTs) {
      byDay.set(key, session)
    }
  }

  return [...byDay.values()].sort((a, b) => {
    const da = asDate(a.date)?.getTime() ?? 0
    const db = asDate(b.date)?.getTime() ?? 0
    return da - db
  })
}

function sessionId(session: ActivitySessionForExport): string {
  if (session.id) return String(session.id)
  if (session._id != null) return String(session._id)
  const d = asDate(session.date)
  return `mobile-${d ? utcDateKey(d) : 'unknown'}`
}

function buildNotes(session: ActivitySessionForExport): string {
  const parts = ['[Sleep Lock export]']
  if (session.source) parts.push(`source=${session.source}`)
  if (session.stepsCount != null && Number.isFinite(session.stepsCount)) {
    parts.push(`stepsCount=${Math.round(session.stepsCount)}`)
  }
  const arrival = asDate(session.homeArrivalTime ?? null)
  if (arrival) {
    parts.push(`homeArrivalTime=${arrival.toISOString()}`)
  }
  return parts.join(' ')
}

/**
 * Map one activity session → Phase 1 nested SleepEntry (children null).
 * Times available on mobile become bed/wake; quality fields stay null.
 */
export function activitySessionToPhase1Entry(
  session: ActivitySessionForExport
): Phase1SleepEntryExport {
  const date = asDate(session.date)
  if (!date) {
    throw new Error('Activity session missing valid date')
  }
  const bedTime = asDate(session.bedTime)
  const wakeTime = asDate(session.wakeTime)

  return {
    id: sessionId(session),
    date,
    bedTime,
    attemptSleepTime: bedTime,
    estimatedSleepTime: bedTime,
    wakeTime,
    outOfBedTime: wakeTime,
    numberOfAwakenings: null,
    sleepQuality: null,
    energyMorning: null,
    energyWork: null,
    notes: buildNotes(session),
    mood: null,
    food: null,
    exercise: null,
    environment: null,
    health: null,
  }
}

/** Pure builder — same envelope as Phase 1 sleepEntriesToJsonExport. */
export function sessionsToPhase1JsonExport(
  sessions: ActivitySessionForExport[],
  options?: { month?: string; now?: Date }
): Phase1JsonExport {
  const filtered = filterSessionsByMonth(sessions, options?.month)
  const collapsed = collapseSessionsByDate(filtered)
  const entries = collapsed.map(activitySessionToPhase1Entry)
  const now = options?.now ?? new Date()

  return {
    format: 'json',
    exportedAt: now.toISOString(),
    entryCount: entries.length,
    entries,
    origin: 'mobile-server',
  }
}
