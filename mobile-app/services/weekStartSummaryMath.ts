/**
 * Step 204 — Start-of-week summary (Insights-style copy + Monday notification).
 * Pure — no Expo imports.
 */

export const WEEK_START_DAY = 1 // Monday (Date#getDay)
export const WEEK_START_SUMMARY_HOUR = 9
export const WEEK_START_SUMMARY_MINUTE = 0

export const WEEK_START_SUMMARY_TITLE = 'Sleep Lock'
export const WEEK_START_SUMMARY_NOTIFICATION_ID =
  'sleep-lock-week-start-summary'
export const WEEK_START_SUMMARY_ROUTE = '/week-start-summary'
export const WEEK_START_SUMMARY_DEEP_LINK = 'sleeplock://week-start-summary'
export const WEEK_START_SUMMARY_TYPE = 'week-start-summary'

export const WEEK_START_SUMMARY_NOTIFICATION_BODY =
  'Your last-week sleep summary is ready.'

export type WeekStartNight = {
  date: Date | string
  bedTime: Date | string
  wakeTime: Date | string
  durationMinutes: number
  adherenceMinutes: number | null
}

export type WeekStartInsight = {
  headline: string
  /** Full Insights-panel sentence for the card. */
  body: string
  avgBedTimeLabel: string
  avgWakeTimeLabel: string
  avgAdherenceMinutes: number | null
  adherencePhrase: string
  bestNightLabel: string
  mostDriftedNightLabel: string
  nightCount: number
  /** False when numbers are real (not empty placeholders). */
  isPlaceholder: boolean
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function asDate(value: Date | string): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date in week-start night')
  }
  return d
}

export function isWeekStartDay(now = new Date()): boolean {
  return now.getDay() === WEEK_START_DAY
}

/**
 * Next Monday at 09:00 local, strictly after `now`.
 * Advancing the device clock past this instant is what fires the notification.
 */
export function nextWeekStartFireAt(
  now = new Date(),
  hour = WEEK_START_SUMMARY_HOUR,
  minute = WEEK_START_SUMMARY_MINUTE
): Date {
  const fire = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  )
  const dayDelta = (WEEK_START_DAY - now.getDay() + 7) % 7
  fire.setDate(fire.getDate() + dayDelta)
  if (fire.getTime() <= now.getTime()) {
    fire.setDate(fire.getDate() + 7)
  }
  return fire
}

/** True when `now` has passed a previously scheduled week-start fire. */
export function hasPassedWeekStartFire(
  now: Date,
  scheduledFireAt: Date
): boolean {
  return now.getTime() >= scheduledFireAt.getTime()
}

function minutesSinceMidnightLocal(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

function circularMeanMinutes(minutesList: number[]): number | null {
  if (!minutesList.length) return null
  const DAY = 24 * 60
  let sinSum = 0
  let cosSum = 0
  for (const minutes of minutesList) {
    const angle = (minutes / DAY) * 2 * Math.PI
    sinSum += Math.sin(angle)
    cosSum += Math.cos(angle)
  }
  const meanAngle = Math.atan2(
    sinSum / minutesList.length,
    cosSum / minutesList.length
  )
  let meanMinutes = (meanAngle / (2 * Math.PI)) * DAY
  if (meanMinutes < 0) meanMinutes += DAY
  return meanMinutes
}

export function formatClock12hFromMinutes(minutes: number): string {
  const rounded = Math.round(minutes) % (24 * 60)
  const h24 = Math.floor(rounded / 60)
  const m = rounded % 60
  const d = new Date()
  d.setHours(h24, m, 0, 0)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function weekdayName(at: Date): string {
  return DAY_NAMES[at.getDay()]
}

export function formatAdherencePhrase(
  avgAdherenceMinutes: number | null
): string {
  if (avgAdherenceMinutes == null || !Number.isFinite(avgAdherenceMinutes)) {
    return 'schedule comparison unavailable'
  }
  const abs = Math.abs(Math.round(avgAdherenceMinutes))
  if (abs === 0) return 'on schedule'
  if (avgAdherenceMinutes > 0) {
    return `${abs} min later than scheduled`
  }
  return `${abs} min earlier than scheduled`
}

function meanRounded(values: number[]): number | null {
  if (!values.length) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Insights-style last-week card from passive weekly nights (real numbers).
 */
export function buildWeekStartInsight(
  nights: WeekStartNight[],
  options?: { avgAdherenceMinutes?: number | null }
): WeekStartInsight {
  if (!nights.length) {
    return {
      headline: 'Last week',
      body: 'Last week: not enough passive sleep data yet.',
      avgBedTimeLabel: '—',
      avgWakeTimeLabel: '—',
      avgAdherenceMinutes: null,
      adherencePhrase: 'not enough data',
      bestNightLabel: '—',
      mostDriftedNightLabel: '—',
      nightCount: 0,
      isPlaceholder: true,
    }
  }

  const parsed = nights.map((n) => ({
    date: asDate(n.date),
    bedTime: asDate(n.bedTime),
    wakeTime: asDate(n.wakeTime),
    durationMinutes: n.durationMinutes,
    adherenceMinutes: n.adherenceMinutes,
  }))

  const bedMean = circularMeanMinutes(
    parsed.map((n) => minutesSinceMidnightLocal(n.bedTime))
  )
  const wakeMean = circularMeanMinutes(
    parsed.map((n) => minutesSinceMidnightLocal(n.wakeTime))
  )

  const avgBedTimeLabel =
    bedMean == null ? '—' : formatClock12hFromMinutes(bedMean)
  const avgWakeTimeLabel =
    wakeMean == null ? '—' : formatClock12hFromMinutes(wakeMean)

  const adherenceValues = parsed
    .map((n) => n.adherenceMinutes)
    .filter((n): n is number => n != null && Number.isFinite(n))
  const avgAdherenceMinutes =
    options?.avgAdherenceMinutes ?? meanRounded(adherenceValues)
  const adherencePhrase = formatAdherencePhrase(avgAdherenceMinutes)

  // Best = closest to schedule; most drifted = largest |adherence|
  let best = parsed[0]
  let drifted = parsed[0]
  for (const n of parsed) {
    const a = n.adherenceMinutes
    const bestA = best.adherenceMinutes
    const driftA = drifted.adherenceMinutes
    if (a != null && (bestA == null || Math.abs(a) < Math.abs(bestA))) {
      best = n
    }
    if (a != null && (driftA == null || Math.abs(a) > Math.abs(driftA))) {
      drifted = n
    }
  }

  // Fallback to longest / shortest duration when adherence missing
  if (adherenceValues.length === 0) {
    best = parsed.reduce((a, b) =>
      b.durationMinutes > a.durationMinutes ? b : a
    )
    drifted = parsed.reduce((a, b) =>
      b.durationMinutes < a.durationMinutes ? b : a
    )
  }

  const bestNightLabel = weekdayName(best.date)
  const mostDriftedNightLabel = weekdayName(drifted.date)

  const body = `Last week: avg bedtime ${avgBedTimeLabel} (${adherencePhrase}), avg wake ${avgWakeTimeLabel}, best night ${bestNightLabel}, most drifted night ${mostDriftedNightLabel}.`

  return {
    headline: 'Last week',
    body,
    avgBedTimeLabel,
    avgWakeTimeLabel,
    avgAdherenceMinutes,
    adherencePhrase,
    bestNightLabel,
    mostDriftedNightLabel,
    nightCount: parsed.length,
    isPlaceholder: false,
  }
}
