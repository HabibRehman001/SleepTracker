import {
  filterEntriesByAnalyticsRange,
  parseAnalyticsDateRange,
} from '../src/utils/analyticsRange'
import { assert, assertEqual, runTest } from './helpers'

/** Step 90 — date-range filter for analytics endpoints. */
export async function runAnalyticsRangeTests(): Promise<boolean> {
  console.log('\nanalytics range filter')

  const results = [
    await runTest('parseAnalyticsDateRange', () => {
      assertEqual(parseAnalyticsDateRange('7d'), '7d', '7d')
      assertEqual(parseAnalyticsDateRange('30d'), '30d', '30d')
      assertEqual(parseAnalyticsDateRange('90d'), '90d', '90d')
      assertEqual(parseAnalyticsDateRange('all'), 'all', 'all')
      assertEqual(parseAnalyticsDateRange('x'), 'all', 'fallback')
    }),
    await runTest('filterEntriesByAnalyticsRange 7d window', () => {
      const now = new Date('2026-07-15T12:00:00.000Z')
      const entries = [
        { date: new Date('2026-07-08T00:00:00.000Z') },
        { date: new Date('2026-07-09T00:00:00.000Z') },
        { date: new Date('2026-07-15T00:00:00.000Z') },
      ]
      const kept = filterEntriesByAnalyticsRange(entries, '7d', now)
      assertEqual(kept.length, 2, 'keeps 2 of 3')
      assert(
        kept.every((e) => e.date.toISOString().slice(0, 10) >= '2026-07-09'),
        'cutoff 2026-07-09'
      )
    }),
  ]

  return results.every(Boolean)
}
