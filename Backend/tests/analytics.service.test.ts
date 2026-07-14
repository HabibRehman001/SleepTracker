import {
  computeAnalyticsSummary,
  computeSummary,
  consistencyScore,
  correlateBoolean,
  latencyMinutes,
  pearsonCorrelation,
  cumulativeSleepDebt,
  cumulativeSleepDebtSeries,
  sleepDebt,
  sleepDurationHours,
  sleepDurationMinutes,
} from '../src/services/analytics.service'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
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
    bedTime: partial.bedTime ?? null,
    attemptSleepTime: partial.attemptSleepTime ?? null,
    estimatedSleepTime: partial.estimatedSleepTime ?? null,
    wakeTime: partial.wakeTime ?? null,
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
    await runTest(
      'sleepDurationMinutes: 04:00 → 12:00 same day = 480',
      () => {
        const minutes = sleepDurationMinutes({
          estimatedSleepTime: new Date('2026-07-09T04:00:00.000Z'),
          attemptSleepTime: null,
          bedTime: new Date('2026-07-09T04:00:00.000Z'),
          wakeTime: new Date('2026-07-09T12:00:00.000Z'),
        })
        assertEqual(minutes, 480, '8 hours in minutes')
        assertClose(sleepDurationHours(
          makeEntry({
            sleepQuality: 8,
            estimatedSleepTime: new Date('2026-07-09T04:00:00.000Z'),
            wakeTime: new Date('2026-07-09T12:00:00.000Z'),
          })
        )!, 8, 0.001, 'hours')
      }
    )
  )

  results.push(
    await runTest(
      'sleepDurationMinutes: overnight crossing midnight = 450',
      () => {
        // Sleep 23:30 Jul 9 → wake 07:00 Jul 10 (full timestamps, not time-only)
        const minutes = sleepDurationMinutes({
          estimatedSleepTime: new Date('2026-07-09T23:30:00.000Z'),
          attemptSleepTime: new Date('2026-07-09T23:20:00.000Z'),
          bedTime: new Date('2026-07-09T23:00:00.000Z'),
          wakeTime: new Date('2026-07-10T07:00:00.000Z'),
        })
        assertEqual(minutes, 450, '7.5 hours overnight')
      }
    )
  )

  results.push(
    await runTest(
      'sleepDurationMinutes: null when wake missing or before sleep',
      () => {
        assertEqual(
          sleepDurationMinutes({
            estimatedSleepTime: new Date('2026-07-09T04:00:00.000Z'),
            attemptSleepTime: null,
            bedTime: null,
            wakeTime: null,
          }),
          null,
          'missing wake'
        )
        assertEqual(
          sleepDurationMinutes({
            estimatedSleepTime: new Date('2026-07-09T12:00:00.000Z'),
            attemptSleepTime: null,
            bedTime: null,
            wakeTime: new Date('2026-07-09T04:00:00.000Z'),
          }),
          null,
          'wake before sleep'
        )
      }
    )
  )

  results.push(
    await runTest(
      'sleepDebt: 7 nights of exactly 8h → 0',
      () => {
        const entries = Array.from({ length: 7 }, (_, index) =>
          makeEntry({
            id: `eight-${index}`,
            date: new Date(`2026-02-0${index + 1}T00:00:00.000Z`),
            sleepQuality: 8,
            estimatedSleepTime: new Date(`2026-02-0${index + 1}T04:00:00.000Z`),
            wakeTime: new Date(`2026-02-0${index + 1}T12:00:00.000Z`),
          })
        )
        assertEqual(sleepDebt(entries), 0, 'no debt at target')
      }
    )
  )

  results.push(
    await runTest(
      'sleepDebt: 7 nights of 6h → 840 minutes (14h)',
      () => {
        // TARGET 480 - 360 = 120 deficit/night × 7 = 840
        const entries = Array.from({ length: 7 }, (_, index) =>
          makeEntry({
            id: `six-${index}`,
            date: new Date(`2026-03-0${index + 1}T00:00:00.000Z`),
            sleepQuality: 5,
            estimatedSleepTime: new Date(`2026-03-0${index + 1}T04:00:00.000Z`),
            wakeTime: new Date(`2026-03-0${index + 1}T10:00:00.000Z`),
          })
        )
        assertEqual(sleepDebt(entries), 840, '14 hours of debt in minutes')
      }
    )
  )

  results.push(
    await runTest(
      'cumulative sleep debt: 5×6h + 1×10h → reduces but does not zero',
      () => {
        // 5 × 120 = 600; 10h night recovers 120 → 480
        const entries = [
          ...Array.from({ length: 5 }, (_, index) =>
            makeEntry({
              id: `cum-six-${index}`,
              date: new Date(2026, 0, 1 + index),
              sleepQuality: 5,
              estimatedSleepTime: new Date(2026, 0, 1 + index, 0, 0),
              wakeTime: new Date(2026, 0, 1 + index, 6, 0),
            })
          ),
          makeEntry({
            id: 'cum-ten',
            date: new Date(2026, 0, 6),
            sleepQuality: 8,
            estimatedSleepTime: new Date(2026, 0, 6, 0, 0),
            wakeTime: new Date(2026, 0, 6, 10, 0),
          }),
        ]
        const series = cumulativeSleepDebtSeries(entries)
        assertEqual(series.length, 6, 'six nights')
        assertEqual(series[4].debtMinutes, 600, 'after five 6h nights')
        assertEqual(series[5].debtMinutes, 480, 'after recovery night')
        assertEqual(series[5].nightDelta, -120, 'surplus delta')
        assertEqual(cumulativeSleepDebt(entries), 480, 'final cumulative')
        assert(cumulativeSleepDebt(entries) > 0, 'single surplus does not wipe')
      }
    )
  )

  results.push(
    await runTest(
      'latencyMinutes: 04:00 attempt → 05:27 estimated = 87',
      () => {
        const minutes = latencyMinutes({
          attemptSleepTime: new Date('2026-07-09T04:00:00.000Z'),
          estimatedSleepTime: new Date('2026-07-09T05:27:00.000Z'),
        })
        assertEqual(minutes, 87, '87 minutes latency')
      }
    )
  )

  results.push(
    await runTest(
      'latencyMinutes: null without attempt or estimated',
      () => {
        assertEqual(
          latencyMinutes({
            attemptSleepTime: null,
            estimatedSleepTime: new Date('2026-07-09T05:00:00.000Z'),
          }),
          null,
          'missing attempt'
        )
        assertEqual(
          latencyMinutes({
            attemptSleepTime: new Date('2026-07-09T04:00:00.000Z'),
            estimatedSleepTime: null,
          }),
          null,
          'missing estimated'
        )
      }
    )
  )

  results.push(
    await runTest(
      'consistencyScore: identical bedtimes → 100',
      () => {
        const entries = Array.from({ length: 7 }, (_, index) => {
          const day = index + 1
          return makeEntry({
            id: `same-bed-${index}`,
            date: new Date(2026, 3, day),
            sleepQuality: 8,
            bedTime: new Date(2026, 3, day, 23, 0, 0),
            wakeTime: new Date(2026, 3, day + 1, 7, 0, 0),
          })
        })
        assertEqual(consistencyScore(entries), 100, 'perfect consistency')
      }
    )
  )

  results.push(
    await runTest(
      'consistencyScore: wildly varying bedtimes → near 0',
      () => {
        const hours = [22, 2, 18, 5, 0, 20, 3]
        const entries = hours.map((hour, index) => {
          const day = index + 1
          return makeEntry({
            id: `wild-${index}`,
            date: new Date(2026, 4, day),
            sleepQuality: 5,
            bedTime: new Date(2026, 4, day, hour, 0, 0),
            wakeTime: new Date(2026, 4, day + 1, 7, 0, 0),
          })
        })
        const score = consistencyScore(entries)
        assert(score < 20, `expected low score, got ${score}`)
      }
    )
  )

  results.push(
    await runTest(
      'correlateBoolean hand fixture — exact known averages',
      () => {
        /**
         * 10 rows (phone × latency):
         * YES: 40,50,60,70,80 → avg 60, n=5
         * NO:  10,20,30       → avg 20, n=3
         * skip: factor null; factor true + outcome null
         */
        type Row = { phone: boolean | null; latency: number | null }
        const fixture: Row[] = [
          { phone: true, latency: 40 },
          { phone: true, latency: 50 },
          { phone: true, latency: 60 },
          { phone: true, latency: 70 },
          { phone: true, latency: 80 },
          { phone: false, latency: 10 },
          { phone: false, latency: 20 },
          { phone: false, latency: 30 },
          { phone: null, latency: 99 },
          { phone: true, latency: null },
        ]

        const result = correlateBoolean(
          fixture,
          (e) => e.phone,
          (e) => e.latency
        )

        assertEqual(result.groupA.n, 5, 'groupA n')
        assertEqual(result.groupA.avg, 60, 'groupA avg (40+50+60+70+80)/5')
        assertEqual(result.groupB.n, 3, 'groupB n')
        assertEqual(result.groupB.avg, 20, 'groupB avg (10+20+30)/3')
      }
    )
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

  results.push(
    await runTest('computeSummary averages last 7 known durations', () => {
      const hours = [7, 7.5, 8, 6.5, 8, 7, 7.5]
      const entries = hours.map((h, index) => {
        const date = new Date(`2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`)
        const estimated = new Date(date)
        estimated.setUTCHours(0, 0, 0, 0)
        const wake = new Date(estimated.getTime() + h * 3_600_000)
        return makeEntry({
          id: String(index),
          date,
          sleepQuality: 7,
          estimatedSleepTime: estimated,
          wakeTime: wake,
          bedTime: new Date(estimated.getTime() - 20 * 60_000),
          attemptSleepTime: new Date(estimated.getTime() - 10 * 60_000),
        })
      })

      const summary = computeSummary(entries)
      const manualAvg = hours.reduce((a, b) => a + b, 0) / hours.length
      assert(summary.avg7day !== null, 'avg7day present')
      assertClose(summary.avg7day!, Number(manualAvg.toFixed(2)), 0.01, 'avg7day vs spreadsheet')
      assert(summary.todaySleep !== null, 'todaySleep')
      assertClose(summary.todaySleep!, 7.5, 0.01, 'last night hours')
      assertEqual(summary.sleepDebt, 270, 'sleepDebt minutes for known week')
      assert(summary.avgLatency !== null, 'avgLatency')
      assert(summary.avgBedtime !== null, 'avgBedtime')
      assert(summary.avgWakeTime !== null, 'avgWakeTime')
      assertEqual(summary.consistencyScore, 100, 'identical relative beds → 100')
    })
  )

  results.push(
    await runTest(
      'seeded DB avg7day matches spreadsheet of last 7 durations',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        const sorted = [...entries].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        )

        const durations = sorted
          .map((entry) => sleepDurationHours(entry))
          .filter((value): value is number => value !== null)

        assert(durations.length >= 7, `need ≥7 duration rows, got ${durations.length}`)

        const last7 = durations.slice(-7)
        const spreadsheetAvg =
          Math.round((last7.reduce((sum, h) => sum + h, 0) / last7.length) * 100) / 100

        const summary = computeSummary(sorted)
        assert(summary.avg7day !== null, 'avg7day')
        assertClose(summary.avg7day!, spreadsheetAvg, 0.01, 'seeded avg7day')

        console.log(
          `    spreadsheet last7=[${last7.map((h) => h.toFixed(2)).join(', ')}] avg=${spreadsheetAvg}`
        )
        console.log(`    computeSummary.avg7day=${summary.avg7day}`)
      }
    )
  )

  return results.every(Boolean)
}
