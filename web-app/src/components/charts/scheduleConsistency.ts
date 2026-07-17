import { format, parseISO } from 'date-fns'

import type { SleepEntry } from '@/types/sleepEntry'

const MINUTES_PER_DAY = 24 * 60

export type SchedulePoint = {
  label: string
  dateKey: string
  /** Clock minutes since midnight (0–1439), raw. */
  minutes: number
  /** Unwrapped toward the window mean for continuous plotting. */
  plotMinutes: number
}

export type ScheduleConsistencySeries = {
  points: SchedulePoint[]
  mean: number
  sd: number
  /** Band edges (unwrapped space, same as plotMinutes). */
  bandLow: number
  bandHigh: number
}

function entryDateKey(entry: SleepEntry): string {
  if (
    entry.date.endsWith('T00:00:00.000Z') ||
    /^\d{4}-\d{2}-\d{2}T00:00/.test(entry.date)
  ) {
    return entry.date.slice(0, 10)
  }
  return format(parseISO(entry.date), 'yyyy-MM-dd')
}

/** Minutes from local midnight (0–1439). */
export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function formatClockMinutes(minutes: number): string {
  const normalized =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/** Circular mean of clock minutes (handles midnight wrap). */
export function circularMeanMinutes(minutesList: number[]): number | null {
  if (minutesList.length === 0) return null

  let sinSum = 0
  let cosSum = 0
  for (const minutes of minutesList) {
    const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI
    sinSum += Math.sin(angle)
    cosSum += Math.cos(angle)
  }

  const meanAngle = Math.atan2(
    sinSum / minutesList.length,
    cosSum / minutesList.length
  )
  let meanMinutes = (meanAngle / (2 * Math.PI)) * MINUTES_PER_DAY
  if (meanMinutes < 0) meanMinutes += MINUTES_PER_DAY
  return meanMinutes
}

/** Circular population stdev of clock minutes. */
export function circularStdMinutes(minutesList: number[]): number {
  if (minutesList.length < 2) return 0
  const mean = circularMeanMinutes(minutesList)
  if (mean == null) return 0

  const squared = minutesList.map((minutes) => {
    let delta = minutes - mean
    if (delta > MINUTES_PER_DAY / 2) delta -= MINUTES_PER_DAY
    if (delta < -MINUTES_PER_DAY / 2) delta += MINUTES_PER_DAY
    return delta * delta
  })

  return Math.sqrt(squared.reduce((a, b) => a + b, 0) / squared.length)
}

/** Shift a clock minute onto a continuous scale nearest `mean`. */
export function unwrapToMean(minutes: number, mean: number): number {
  let m = minutes
  let delta = m - mean
  if (delta > MINUTES_PER_DAY / 2) m -= MINUTES_PER_DAY
  if (delta < -MINUTES_PER_DAY / 2) m += MINUTES_PER_DAY
  return m
}

function buildSeries(
  entries: SleepEntry[],
  pick: (entry: SleepEntry) => Date | null,
  limit: number
): ScheduleConsistencySeries | null {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const raw: { dateKey: string; label: string; minutes: number }[] = []

  for (const entry of sorted.slice(-limit)) {
    const t = pick(entry)
    if (!t) continue
    const dateKey = entryDateKey(entry)
    raw.push({
      dateKey,
      label: dateKey.slice(5),
      minutes: minutesSinceMidnight(t),
    })
  }

  if (raw.length === 0) return null

  const minutesList = raw.map((r) => r.minutes)
  const mean = circularMeanMinutes(minutesList) ?? minutesList[0]
  const sd = circularStdMinutes(minutesList)
  const bandLow = mean - sd
  const bandHigh = mean + sd

  const points: SchedulePoint[] = raw.map((r) => ({
    label: r.label,
    dateKey: r.dateKey,
    minutes: r.minutes,
    plotMinutes: unwrapToMean(r.minutes, mean),
  }))

  return { points, mean, sd, bandLow, bandHigh }
}

export function buildBedtimeConsistencySeries(
  entries: SleepEntry[],
  limit = 14
): ScheduleConsistencySeries | null {
  return buildSeries(
    entries,
    (e) => (e.bedTime ? new Date(e.bedTime) : null),
    limit
  )
}

export function buildWakeConsistencySeries(
  entries: SleepEntry[],
  limit = 14
): ScheduleConsistencySeries | null {
  return buildSeries(
    entries,
    (e) => (e.wakeTime ? new Date(e.wakeTime) : null),
    limit
  )
}

/** Chart rows: daily value + constant band edges for Area/ReferenceArea. */
export function seriesToChartRows(series: ScheduleConsistencySeries) {
  return series.points.map((p) => ({
    label: p.label,
    dateKey: p.dateKey,
    value: p.plotMinutes,
    mean: series.mean,
    sdLow: series.bandLow,
    sdHigh: series.bandHigh,
  }))
}
