/** Shared date-window for analytics endpoints (`?range=`). */
export type AnalyticsDateRange = '7d' | '30d' | '90d' | 'all'

export const ANALYTICS_DATE_RANGES: readonly AnalyticsDateRange[] = [
  '7d',
  '30d',
  '90d',
  'all',
] as const

export function parseAnalyticsDateRange(raw: unknown): AnalyticsDateRange {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') {
    return raw
  }
  return 'all'
}

export function analyticsRangeDayCount(
  range: AnalyticsDateRange
): number | null {
  if (range === '7d') return 7
  if (range === '30d') return 30
  if (range === '90d') return 90
  return null
}

/** Inclusive UTC calendar cutoff (YYYY-MM-DD), or null for all-time. */
export function analyticsRangeCutoffKey(
  range: AnalyticsDateRange,
  now = new Date()
): string | null {
  const days = analyticsRangeDayCount(range)
  if (days == null) return null
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  end.setUTCDate(end.getUTCDate() - (days - 1))
  return end.toISOString().slice(0, 10)
}

export function entryDateKey(date: Date | string): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10)
    return new Date(date).toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

/** Keep entries on/after the range cutoff (inclusive). */
export function filterEntriesByAnalyticsRange<
  T extends { date: Date | string },
>(entries: T[], range: AnalyticsDateRange, now = new Date()): T[] {
  const cutoff = analyticsRangeCutoffKey(range, now)
  if (!cutoff) return entries
  return entries.filter((e) => entryDateKey(e.date) >= cutoff)
}
