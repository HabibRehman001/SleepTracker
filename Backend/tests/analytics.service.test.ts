import {
  computeAnalyticsSummary,
  pearsonCorrelation,
} from '../src/services/analytics.service'
import type { SleepEntryWithRelations } from '../src/types'
import { assert, assertClose, assertEqual, runTest } from './helpers'

function makeEntry(
  partial: Partial<SleepEntryWithRelations> & {
    sleepQuality: number | null
  }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? 'test',
    date: partial.date ?? new Date('2026-01-01'),
    bedTime: null,
    attemptSleepTime: null,
    estimatedSleepTime: null,
    wakeTime: null,
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: partial.sleepQuality,
    energyMorning: null,
    energyWork: null,
    notes: null,
    mood: partial.mood ?? null,
    food: partial.food ?? null,
    exercise: partial.exercise ?? null,
    environment: partial.environment ?? null,
    health: partial.health ?? null,
  }
}

export async function runAnalyticsServiceTests(): Promise<boolean> {
  console.log('\n[analytics.service]')
  const results: boolean[] = []

  results.push(
    await runTest('pearsonCorrelation perfect positive', () => {
      const result = pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])
      assert(result !== null, 'expected a number')
      assertClose(result, 1, 1e-9, 'perfect positive')
    })
  )

  results.push(
    await runTest('pearsonCorrelation perfect negative', () => {
      const result = pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])
      assert(result !== null, 'expected a number')
      assertClose(result, -1, 1e-9, 'perfect negative')
    })
  )

  results.push(
    await runTest('pearsonCorrelation returns null for short arrays', () => {
      assertEqual(pearsonCorrelation([1], [2]), null, 'n=1')
      assertEqual(pearsonCorrelation([], []), null, 'empty')
    })
  )

  results.push(
    await runTest('pearsonCorrelation returns null for mismatched lengths', () => {
      assertEqual(pearsonCorrelation([1, 2], [1]), null, 'mismatch')
    })
  )

  results.push(
    await runTest('computeAnalyticsSummary with fake entries (no Express/DB)', () => {
      const summary = computeAnalyticsSummary([
        makeEntry({
          id: '1',
          sleepQuality: 8,
          mood: { mood: 7, stress: 3, anxiety: 2, motivation: 8 },
          food: { mealBeforeSleep: false, caffeineAmountMg: 40 },
          exercise: { exercise: true, duration: 40 },
          environment: {
            phoneUsedBeforeSleep: false,
            minutesPhoneBeforeSleep: 0,
            roomTemp: 22,
          },
        }),
        makeEntry({
          id: '2',
          sleepQuality: 4,
          mood: { mood: 4, stress: 8, anxiety: 7, motivation: 3 },
          food: { mealBeforeSleep: true, caffeineAmountMg: 200 },
          exercise: { exercise: false, duration: null },
          environment: {
            phoneUsedBeforeSleep: true,
            minutesPhoneBeforeSleep: 45,
            roomTemp: 24,
          },
        }),
      ])

      assertEqual(summary.entryCount, 2, 'entryCount')
      assertEqual(summary.averageSleepQuality, 6, 'averageSleepQuality')
      assert(summary.correlations.length >= 1, 'expected correlations')

      const stress = summary.correlations.find((c) => c.factor === 'stress')
      assert(stress, 'stress correlation present')
      assertClose(stress.coefficient, -1, 1e-4, 'stress vs quality')
    })
  )

  return results.every(Boolean)
}
