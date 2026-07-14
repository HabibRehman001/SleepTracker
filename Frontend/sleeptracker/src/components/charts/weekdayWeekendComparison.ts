import { format, parseISO } from 'date-fns'

import {
  circularMeanMinutes,
  formatClockMinutes,
  minutesSinceMidnight,
} from '@/components/charts/scheduleConsistency'
import { sleepDurationHours } from '@/components/charts/sleepDuration'
import type { SleepEntry } from '@/types/sleepEntry'

export type ScheduleSideStats = {
  bedtimeMinutes: number | null
  durationHours: number | null
  quality: number | null
  n: number
}

export type WeekdayWeekendAverages = {
  weekday: ScheduleSideStats
  weekend: ScheduleSideStats
}

export type WeekdayWeekendBarRow = {
  metric: string
  /** Bar height (normalized 0–100 within the metric). */
  weekday: number
  weekend: number
  weekdayText: string
  weekendText: string
  weekdayRaw: number | null
  weekendRaw: number | null
}

/** Weekend = Sat/Sun — matches backend isWeekend. */
export function isWeekendEntryDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  const day = d.getDay()
  return day === 0 || day === 6
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function round(value: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

function entryCalendarDate(entry: SleepEntry): Date {
  if (
    entry.date.endsWith('T00:00:00.000Z') ||
    /^\d{4}-\d{2}-\d{2}T00:00/.test(entry.date)
  ) {
    const [y, m, d] = entry.date.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return parseISO(entry.date)
}

function sideStats(entries: SleepEntry[]): ScheduleSideStats {
  const bedMinutes: number[] = []
  const durations: number[] = []
  const qualities: number[] = []

  for (const entry of entries) {
    if (entry.bedTime) {
      bedMinutes.push(minutesSinceMidnight(new Date(entry.bedTime)))
    }
    const hours = sleepDurationHours(entry)
    if (hours != null) durations.push(hours)
    if (entry.sleepQuality != null && Number.isFinite(entry.sleepQuality)) {
      qualities.push(entry.sleepQuality)
    }
  }

  const bedtime = circularMeanMinutes(bedMinutes)
  const duration = mean(durations)
  const quality = mean(qualities)

  return {
    bedtimeMinutes: bedtime == null ? null : round(bedtime, 1),
    durationHours: duration == null ? null : round(duration, 2),
    quality: quality == null ? null : round(quality, 2),
    n: entries.length,
  }
}

export function computeWeekdayWeekendAverages(
  entries: SleepEntry[]
): WeekdayWeekendAverages {
  const weekday: SleepEntry[] = []
  const weekend: SleepEntry[] = []
  for (const entry of entries) {
    if (isWeekendEntryDate(entryCalendarDate(entry))) weekend.push(entry)
    else weekday.push(entry)
  }
  return {
    weekday: sideStats(weekday),
    weekend: sideStats(weekend),
  }
}

function formatDuration(hours: number | null): string {
  if (hours == null) return '—'
  return `${hours}h`
}

function formatQuality(q: number | null): string {
  if (q == null) return '—'
  return String(q)
}

function formatBed(minutes: number | null): string {
  if (minutes == null) return '—'
  return formatClockMinutes(minutes)
}

/**
 * Normalize WD/WE pair so the taller bar is 100 — side-by-side comparison
 * stays readable when bedtime (hours), duration, and quality share one axis.
 */
function normalizedPair(
  weekdayRaw: number | null,
  weekendRaw: number | null
): { weekday: number; weekend: number } {
  if (weekdayRaw == null && weekendRaw == null) {
    return { weekday: 0, weekend: 0 }
  }
  const wd = weekdayRaw ?? 0
  const we = weekendRaw ?? 0
  const peak = Math.max(Math.abs(wd), Math.abs(we), 1e-9)
  return {
    weekday: round((wd / peak) * 100, 2),
    weekend: round((we / peak) * 100, 2),
  }
}

/** Grouped-bar rows: Bedtime / Duration / Quality × Weekday / Weekend. */
export function buildWeekdayWeekendBarRows(
  entries: SleepEntry[]
): WeekdayWeekendBarRow[] {
  const { weekday, weekend } = computeWeekdayWeekendAverages(entries)

  const bedtime = normalizedPair(weekday.bedtimeMinutes, weekend.bedtimeMinutes)
  const duration = normalizedPair(weekday.durationHours, weekend.durationHours)
  const quality = normalizedPair(weekday.quality, weekend.quality)

  return [
    {
      metric: 'Avg bedtime',
      ...bedtime,
      weekdayText: formatBed(weekday.bedtimeMinutes),
      weekendText: formatBed(weekend.bedtimeMinutes),
      weekdayRaw: weekday.bedtimeMinutes,
      weekendRaw: weekend.bedtimeMinutes,
    },
    {
      metric: 'Avg duration',
      ...duration,
      weekdayText: formatDuration(weekday.durationHours),
      weekendText: formatDuration(weekend.durationHours),
      weekdayRaw: weekday.durationHours,
      weekendRaw: weekend.durationHours,
    },
    {
      metric: 'Avg quality',
      ...quality,
      weekdayText: formatQuality(weekday.quality),
      weekendText: formatQuality(weekend.quality),
      weekdayRaw: weekday.quality,
      weekendRaw: weekend.quality,
    },
  ]
}

/** True when both sides have at least one usable bedtime/duration/quality. */
export function hasWeekdayWeekendComparison(entries: SleepEntry[]): boolean {
  const { weekday, weekend } = computeWeekdayWeekendAverages(entries)
  const sideOk = (s: ScheduleSideStats) =>
    s.bedtimeMinutes != null || s.durationHours != null || s.quality != null
  return sideOk(weekday) && sideOk(weekend)
}

export function entryDateLabel(entry: SleepEntry): string {
  return format(entryCalendarDate(entry), 'yyyy-MM-dd')
}
