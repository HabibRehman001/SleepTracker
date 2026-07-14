import {
  computePersonalRecords,
  longestStreak,
  longestStreakByDate,
  sleepQuality,
} from '../src/services/analytics.service'
import type { SleepEntryWithRelations } from '../src/types'
import { assert, assertEqual, runTest } from './helpers'

function makeEntry(
  partial: Partial<SleepEntryWithRelations> & {
    date: Date
    sleepQuality?: number | null
  }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? `e-${partial.date.toISOString()}`,
    date: partial.date,
    bedTime: partial.bedTime ?? null,
    attemptSleepTime: partial.attemptSleepTime ?? null,
    estimatedSleepTime: partial.estimatedSleepTime ?? null,
    wakeTime: partial.wakeTime ?? null,
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: partial.sleepQuality ?? null,
    energyMorning: null,
    energyWork: null,
    notes: null,
    mood: null,
    food: null,
    exercise: null,
    environment: null,
    health: null,
  }
}

/** Step 95 — longest streak + personal records. */
export async function runStreaksTests(): Promise<boolean> {
  console.log('\nlongest streak & personal records')

  const results = [
    await runTest(
      '5-day quality≥7 streak surrounded by quality-4 → exactly 5',
      () => {
        const qualities = [4, 4, 8, 8, 8, 8, 8, 4, 4]
        const entries = qualities.map((q, i) =>
          makeEntry({
            date: new Date(2026, 0, 1 + i),
            sleepQuality: q,
          })
        )
        const good = (e: SleepEntryWithRelations) =>
          (sleepQuality(e) ?? 0) >= 7

        assertEqual(longestStreak(entries, good), 5, 'streak length')
        assertEqual(
          longestStreakByDate([...entries].reverse(), good),
          5,
          'by date ignores reverse order'
        )
      }
    ),
    await runTest('personal records quality best/worst', () => {
      const entries = [
        makeEntry({
          id: 'w',
          date: new Date(2026, 0, 1),
          sleepQuality: 2,
        }),
        makeEntry({
          id: 'b',
          date: new Date(2026, 0, 2),
          sleepQuality: 10,
        }),
      ]
      const quality = computePersonalRecords(entries).find(
        (r) => r.key === 'sleepQuality'
      )!
      assertEqual(quality.best?.value, 10, 'best quality')
      assertEqual(quality.worst?.value, 2, 'worst quality')
    }),
  ]

  return results.every(Boolean)
}
