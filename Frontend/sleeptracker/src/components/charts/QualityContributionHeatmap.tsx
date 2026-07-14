import { addDays, format, parseISO, subDays } from 'date-fns'

import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import type { HeatmapDay } from '@/components/charts/contributionGrid'
import type { SleepEntry } from '@/types/sleepEntry'

function entryDateKey(entry: SleepEntry): string {
  if (
    entry.date.endsWith('T00:00:00.000Z') ||
    /^\d{4}-\d{2}-\d{2}T00:00/.test(entry.date)
  ) {
    return entry.date.slice(0, 10)
  }
  return format(parseISO(entry.date), 'yyyy-MM-dd')
}

/** Map entries → quality cells for the contribution heatmap. */
export function sleepEntriesToQualityDays(entries: SleepEntry[]): HeatmapDay[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entryDateKey(entry),
      value: entry.sleepQuality,
    }))
}

export type QualityContributionHeatmapProps = {
  entries: SleepEntry[]
  /** Inclusive window length in days (default 365 ≈ one year). */
  days?: number
  title?: string
  className?: string
}

/**
 * GitHub-style contribution heatmap — cell intensity = sleep quality (1–10).
 * Renders ~52 week columns for a full year; scrolls horizontally, no page overflow.
 */
export function QualityContributionHeatmap({
  entries,
  days: windowDays = 365,
  title = 'Sleep quality (year)',
  className,
}: QualityContributionHeatmapProps) {
  const qualityDays = sleepEntriesToQualityDays(entries)

  const end =
    qualityDays.length > 0
      ? parseISO(qualityDays[qualityDays.length - 1].date)
      : new Date()
  const start = subDays(end, windowDays - 1)

  return (
    <HeatmapCalendar
      title={title}
      days={qualityDays}
      startDate={start}
      endDate={end}
      maxValue={10}
      emptyMessage="Log nights to fill the quality heatmap."
      className={className}
      data-testid="quality-contribution-heatmap"
    />
  )
}

/** Build 365 synthetic quality days for layout tests. */
export function seedYearQualityDays(
  endDate: Date = new Date(2026, 6, 14),
  count = 365
): HeatmapDay[] {
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(endDate, -(count - 1 - i))
    return {
      date: format(d, 'yyyy-MM-dd'),
      value: 3 + ((i * 7) % 8), // 3–10
    }
  })
}
