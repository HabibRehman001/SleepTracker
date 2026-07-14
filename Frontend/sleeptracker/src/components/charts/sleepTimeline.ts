import { differenceInMinutes, format, parseISO } from 'date-fns'

import type { SleepEntry } from '@/types/sleepEntry'

/** Sleep-day axis length (noon → next noon). */
export const SLEEP_DAY_MINUTES = 24 * 60

export type SleepTimelineSpan = {
  /** Row label (MM-DD or full date). */
  label: string
  /** ISO date key YYYY-MM-DD. */
  dateKey: string
  /** Invisible pad from axis origin (noon) to bedtime — minutes. */
  pad: number
  /** Visible bar length (wake − bed) — minutes. */
  sleep: number
  /** Absolute offsets for assertions / tooltips. */
  startOffset: number
  endOffset: number
  bedIso: string
  wakeIso: string
}

/**
 * Noon anchor for the sleep day containing `bedTime`.
 * Times before noon belong to the sleep day that started at yesterday's noon.
 */
export function sleepDayNoonAnchor(bedTime: Date): Date {
  const noon = new Date(bedTime)
  noon.setHours(12, 0, 0, 0)
  if (bedTime < noon) {
    noon.setDate(noon.getDate() - 1)
  }
  return noon
}

/** Minutes from the sleep-day noon anchor (may exceed 1440 if wake is past next noon). */
export function minutesFromSleepDayNoon(date: Date, anchor: Date): number {
  return differenceInMinutes(date, anchor)
}

/**
 * Map bedtime → waketime onto a continuous sleep-day axis starting at noon.
 * A 4 AM–12 PM night becomes one bar [960, 1440], not split at midnight.
 */
export function sleepSpanOnSleepDay(
  bedTime: Date,
  wakeTime: Date
): { startOffset: number; endOffset: number; duration: number } | null {
  if (wakeTime <= bedTime) return null
  const anchor = sleepDayNoonAnchor(bedTime)
  const startOffset = minutesFromSleepDayNoon(bedTime, anchor)
  const endOffset = minutesFromSleepDayNoon(wakeTime, anchor)
  if (endOffset <= startOffset) return null
  return {
    startOffset,
    endOffset,
    duration: endOffset - startOffset,
  }
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

function sleepStart(entry: SleepEntry): Date | null {
  const raw =
    entry.estimatedSleepTime ?? entry.attemptSleepTime ?? entry.bedTime
  return raw ? new Date(raw) : null
}

function sleepEnd(entry: SleepEntry): Date | null {
  return entry.wakeTime ? new Date(entry.wakeTime) : null
}

/** Format axis tick: offset minutes → clock label on the sleep-day axis. */
export function formatSleepDayTick(offsetMinutes: number): string {
  const normalized =
    ((Math.round(offsetMinutes) % SLEEP_DAY_MINUTES) + SLEEP_DAY_MINUTES) %
    SLEEP_DAY_MINUTES
  const total = 12 * 60 + normalized // minutes since midnight on anchor day
  const hours = Math.floor(total / 60) % 24
  const mins = total % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Build Recharts rows: stacked pad + sleep → floating horizontal bars.
 * Newest nights first (top of chart).
 */
export function buildSleepTimelineRows(
  entries: SleepEntry[],
  limit = 14
): SleepTimelineSpan[] {
  const rows: SleepTimelineSpan[] = []

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  for (const entry of sorted.slice(-limit)) {
    const bed = sleepStart(entry)
    const wake = sleepEnd(entry)
    if (!bed || !wake) continue
    const span = sleepSpanOnSleepDay(bed, wake)
    if (!span) continue
    const dateKey = entryDateKey(entry)
    rows.push({
      label: dateKey.slice(5),
      dateKey,
      pad: span.startOffset,
      sleep: span.duration,
      startOffset: span.startOffset,
      endOffset: span.endOffset,
      bedIso: bed.toISOString(),
      wakeIso: wake.toISOString(),
    })
  }

  return rows.reverse()
}
