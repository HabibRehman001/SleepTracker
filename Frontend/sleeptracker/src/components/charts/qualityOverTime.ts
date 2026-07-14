import { format, parseISO } from 'date-fns'

import { rollingAverage } from '@/lib/rollingAverage'
import type { SleepEntry } from '@/types/sleepEntry'

export const QUALITY_ROLLING_WINDOW = 7

export type QualityOverTimePoint = {
  label: string
  dateKey: string
  /** Raw daily sleep quality (1–10). */
  quality: number | null
  /** Trailing 7-day mean of available quality values. */
  rolling7: number | null
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

/**
 * Chart-friendly wrapper: same full-window policy as {@link rollingAverage},
 * mapping warm-up / invalid windows to `null` (Recharts skips nulls).
 * Missing daily values become `NaN` so that incomplete windows stay null.
 */
export function rollingAverageForChart(
  values: Array<number | null>,
  window = QUALITY_ROLLING_WINDOW
): Array<number | null> {
  const numeric = values.map((v) =>
    v != null && Number.isFinite(v) ? v : Number.NaN
  )
  return rollingAverage(numeric, window).map((v) =>
    Number.isFinite(v) ? Math.round(v * 100) / 100 : null
  )
}

/** Daily quality + 7-day rolling average for the chart. */
export function buildQualityOverTimePoints(
  entries: SleepEntry[],
  limit = 60
): QualityOverTimePoint[] {
  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)

  const qualities = sorted.map((entry) =>
    entry.sleepQuality != null && Number.isFinite(entry.sleepQuality)
      ? entry.sleepQuality
      : null
  )
  const rolled = rollingAverageForChart(qualities)

  return sorted.map((entry, i) => {
    const dateKey = entryDateKey(entry)
    return {
      label: dateKey.slice(5),
      dateKey,
      quality: qualities[i],
      rolling7: rolled[i],
    }
  })
}

/** Re-export generic util for charts / tests (Step 94). */
export { rollingAverage }
