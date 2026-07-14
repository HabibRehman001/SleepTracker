import { differenceInMinutes, format, parseISO } from 'date-fns'

import type { SleepEntry } from '@/types/sleepEntry'

/** 8-hour target used for bar color coding (matches backend sleep debt). */
export const SLEEP_DURATION_TARGET_HOURS = 8

export type DurationTone = 'green' | 'yellow' | 'red'

export type SleepDurationBar = {
  label: string
  dateKey: string
  hours: number
  tone: DurationTone
}

/**
 * Color vs 8h target:
 * - green: ≥ 8h (on target)
 * - yellow: ≥ 6h and < 8h (short)
 * - red: < 6h (well under)
 */
export function durationTone(
  hours: number,
  targetHours = SLEEP_DURATION_TARGET_HOURS
): DurationTone {
  if (hours >= targetHours) return 'green'
  if (hours >= targetHours - 2) return 'yellow'
  return 'red'
}

export const durationToneFill: Record<DurationTone, string> = {
  green: 'oklch(0.72 0.15 150)',
  yellow: 'oklch(0.78 0.14 85)',
  red: 'oklch(0.65 0.2 25)',
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

export function sleepDurationHours(entry: SleepEntry): number | null {
  const start =
    entry.estimatedSleepTime ?? entry.attemptSleepTime ?? entry.bedTime
  if (!start || !entry.wakeTime) return null
  const minutes = differenceInMinutes(new Date(entry.wakeTime), new Date(start))
  if (minutes <= 0) return null
  return Math.round((minutes / 60) * 100) / 100
}

/** Last `limit` nights with a known duration (default 30). */
export function buildSleepDurationBars(
  entries: SleepEntry[],
  limit = 30
): SleepDurationBar[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((entry) => {
      const hours = sleepDurationHours(entry)
      if (hours == null) return null
      const dateKey = entryDateKey(entry)
      return {
        label: dateKey.slice(5),
        dateKey,
        hours,
        tone: durationTone(hours),
      }
    })
    .filter((row): row is SleepDurationBar => row != null)
}
