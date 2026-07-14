import { describe, expect, it } from 'vitest'
import {
  TARGET_MINUTES,
  MAX_RANKED_INSIGHTS,
  FACTORS,
  OUTCOMES,
  MIN_CORRELATION_GROUP_N,
  pearsonCorrelation,
  linearRegression,
  regressionTrendEndpoints,
  correlateBoolean,
  sleepDurationMinutes,
  sleepDurationHours,
  sleepDebt,
  cumulativeSleepDebt,
  cumulativeSleepDebtSeries,
  rollingAverage,
  longestStreak,
  longestStreakByDate,
  sleepQuality,
  computePersonalRecords,
  latencyMinutes,
  sleepLatencyMinutes,
  minutesSinceMidnight,
  clockMinutes,
  standardDeviation,
  consistencyScore,
  computeAnalyticsSummary,
  computeSummary,
  isWeekend,
  weekendBedtimeShiftHours,
  formatWeekendBedtimeShift,
  weekendJetlagHours,
  detectWeekendJetlag,
  formatWeekendJetlag,
  classifyWeekendJetlag,
  WEEKEND_JETLAG_MINOR_HOURS,
  WEEKEND_JETLAG_MODERATE_HOURS,
  linearRegressionSlope,
  circadianDriftSlope,
  detectCircadianDrift,
  formatCircadianDrift,
  CIRCADIAN_DRIFT_WINDOW_DAYS,
  roomTempBucket,
  optimalRoomTempRange,
  formatOptimalRoomTemp,
  sunriseBeforeBedImpact,
  formatSunriseBeforeBedImpact,
  computeCorrelations,
  insightActionLabel,
  toInsightCandidate,
  generateInsights,
  buildInsights,
  buildCorrelationScatters,
  createAnalyticsService,
  filterEntriesByAnalyticsRange,
  parseAnalyticsDateRange,
  generateInsightSentences,
  insightEffectSize,
  rankInsightCandidates,
  insightTemplates,
} from './analytics.service'
import type { FactorCorrelation, SleepEntryWithRelations } from '../types'

/** Hand-built fake entry — no Prisma / DB. */
function fakeEntry(
  partial: Partial<SleepEntryWithRelations> & {
    date: Date
    sleepQuality?: number | null
  }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? `fake-${partial.date.toISOString()}`,
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
    mood: partial.mood ?? null,
    food: partial.food ?? null,
    exercise: partial.exercise ?? null,
    environment: partial.environment ?? null,
    health: partial.health ?? null,
  }
}

function env(
  overrides: NonNullable<SleepEntryWithRelations['environment']>
): NonNullable<SleepEntryWithRelations['environment']> {
  return {
    phoneUsedBeforeSleep: null,
    minutesPhoneBeforeSleep: null,
    roomTemp: null,
    sunlightSeenBeforeSleep: null,
    ...overrides,
  }
}

/**
 * Two-night fixture (local-time constructors so clock averages are stable):
 *
 * Night A (2026-07-01):
 *   bed 22:00, attempt 22:30, estimated 23:00, wake 07:00 next day
 *   duration = 8h (480m), latency = 30m
 *
 * Night B (2026-07-02):
 *   bed 22:00, attempt 22:00, estimated 23:00, wake 05:00 next day
 *   duration = 6h (360m), latency = 60m
 *
 * Expected computeSummary:
 *   todaySleep  = 6
 *   avg7day     = (8+6)/2 = 7
 *   avg30day    = 7
 *   sleepDebt   = 0 + (480-360) = 120 minutes
 *   avgLatency  = (30+60)/2 = 45
 *   avgBedtime  = 22:00
 *   avgWakeTime = 06:00  (circular mean of 07:00 and 05:00)
 *   consistencyScore = 100 (identical bedtimes)
 */
const twoEntryFixture: SleepEntryWithRelations[] = [
  fakeEntry({
    id: 'night-a',
    date: new Date(2026, 6, 1),
    bedTime: new Date(2026, 6, 1, 22, 0),
    attemptSleepTime: new Date(2026, 6, 1, 22, 30),
    estimatedSleepTime: new Date(2026, 6, 1, 23, 0),
    wakeTime: new Date(2026, 6, 2, 7, 0),
    sleepQuality: 8,
  }),
  fakeEntry({
    id: 'night-b',
    date: new Date(2026, 6, 2),
    bedTime: new Date(2026, 6, 2, 22, 0),
    attemptSleepTime: new Date(2026, 6, 2, 22, 0),
    estimatedSleepTime: new Date(2026, 6, 2, 23, 0),
    wakeTime: new Date(2026, 6, 3, 5, 0),
    sleepQuality: 6,
  }),
]

/** Phone × latency: YES mean 60 (n=3), NO mean 20 (n=3). */
function phoneLatencyFixture(): SleepEntryWithRelations[] {
  const yesLatencies = [40, 60, 80]
  const noLatencies = [10, 20, 30]
  const entries: SleepEntryWithRelations[] = []
  yesLatencies.forEach((lat, i) => {
    const d = new Date(2026, 6, 1 + i)
    entries.push(
      fakeEntry({
        id: `phone-yes-${i}`,
        date: d,
        bedTime: new Date(2026, 6, 1 + i, 22, 0),
        attemptSleepTime: new Date(2026, 6, 1 + i, 22, 0),
        estimatedSleepTime: new Date(2026, 6, 1 + i, 22, lat),
        wakeTime: new Date(2026, 6, 2 + i, 6, 0),
        sleepQuality: 5,
        environment: env({ phoneUsedBeforeSleep: true }),
      })
    )
  })
  noLatencies.forEach((lat, i) => {
    const day = 4 + i
    entries.push(
      fakeEntry({
        id: `phone-no-${i}`,
        date: new Date(2026, 6, day),
        bedTime: new Date(2026, 6, day, 22, 0),
        attemptSleepTime: new Date(2026, 6, day, 22, 0),
        estimatedSleepTime: new Date(2026, 6, day, 22, lat),
        wakeTime: new Date(2026, 6, day + 1, 6, 0),
        sleepQuality: 8,
        environment: env({ phoneUsedBeforeSleep: false }),
      })
    )
  })
  return entries
}

describe('analytics.service (vitest, no DB)', () => {
  describe('constants / registry', () => {
    it('TARGET_MINUTES is 8h', () => {
      expect(TARGET_MINUTES).toBe(480)
    })

    it('MIN_CORRELATION_GROUP_N is 3', () => {
      expect(MIN_CORRELATION_GROUP_N).toBe(3)
    })

    it('MAX_RANKED_INSIGHTS caps at 5', () => {
      expect(MAX_RANKED_INSIGHTS).toBe(5)
    })

    it('FACTORS registry has phone / sunrise / meal / weekend', () => {
      expect(FACTORS.map((f) => f.key)).toEqual([
        'phoneUsedBeforeSleep',
        'sunlightSeenBeforeSleep',
        'mealBeforeSleep',
        'isWeekend',
      ])
    })

    it('OUTCOMES are latency / quality / duration', () => {
      expect(OUTCOMES.map((o) => o.key)).toEqual([
        'latency',
        'quality',
        'duration',
      ])
    })
  })

  describe('rollingAverage (Step 94)', () => {
    it('[1,2,3,4,5] window 3 → [NaN, NaN, 2, 3, 4] (full-window edges)', () => {
      const out = rollingAverage([1, 2, 3, 4, 5], 3)
      expect(out).toHaveLength(5)
      expect(Number.isNaN(out[0])).toBe(true)
      expect(Number.isNaN(out[1])).toBe(true)
      expect(out.slice(2)).toEqual([2, 3, 4])
    })

    it('empty series → []; rejects non-positive window', () => {
      expect(rollingAverage([], 3)).toEqual([])
      expect(() => rollingAverage([1, 2], 0)).toThrow(/windowSize/)
    })
  })

  describe('longest streak & personal records (Step 95)', () => {
    it('5 quality-8 nights among quality-4 → longestStreak === 5', () => {
      const qualities = [4, 4, 8, 8, 8, 8, 8, 4, 4]
      const entries = qualities.map((q, i) =>
        fakeEntry({
          date: new Date(2026, 0, 1 + i),
          sleepQuality: q,
        })
      )
      const good = (e: (typeof entries)[number]) =>
        (sleepQuality(e) ?? 0) >= 7

      expect(longestStreak(entries, good)).toBe(5)

      // Break calendar adjacency in array order; ByDate restores the streak
      const scrambled = [
        entries[4],
        entries[0],
        entries[5],
        entries[7],
        entries[2],
        entries[8],
        entries[3],
        entries[1],
        entries[6],
      ]
      expect(longestStreak(scrambled, good)).toBeLessThan(5)
      expect(longestStreakByDate(scrambled, good)).toBe(5)
    })

    it('computePersonalRecords best/worst quality + latency direction', () => {
      const nights = [
        fakeEntry({
          id: 'low-q',
          date: new Date(2026, 0, 1),
          sleepQuality: 3,
          attemptSleepTime: new Date(2026, 0, 1, 22, 0),
          estimatedSleepTime: new Date(2026, 0, 1, 22, 40),
          wakeTime: new Date(2026, 0, 2, 4, 0),
        }),
        fakeEntry({
          id: 'high-q',
          date: new Date(2026, 0, 2),
          sleepQuality: 9,
          attemptSleepTime: new Date(2026, 0, 2, 22, 0),
          estimatedSleepTime: new Date(2026, 0, 2, 22, 10),
          wakeTime: new Date(2026, 0, 3, 8, 0),
        }),
      ]
      const records = computePersonalRecords(nights)
      const quality = records.find((r) => r.key === 'sleepQuality')!
      expect(quality.best?.value).toBe(9)
      expect(quality.best?.id).toBe('high-q')
      expect(quality.worst?.value).toBe(3)
      expect(quality.worst?.id).toBe('low-q')

      const latency = records.find((r) => r.key === 'latencyMinutes')!
      expect(latency.higherIsBetter).toBe(false)
      expect(latency.best?.value).toBe(10)
      expect(latency.worst?.value).toBe(40)

      const duration = records.find((r) => r.key === 'durationMinutes')!
      // high-q: 22:10 → 08:00 = 590m; low-q: 22:40 → 04:00 = 320m
      expect(duration.best?.value).toBe(590)
      expect(duration.worst?.value).toBe(320)
    })
  })

  describe('pearsonCorrelation', () => {
    it('returns 1 for perfect positive correlation', () => {
      expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 9)
    })

    it('returns -1 for perfect negative correlation', () => {
      expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 9)
    })

    it('returns null for short, mismatched, or zero-variance arrays', () => {
      expect(pearsonCorrelation([1], [2])).toBeNull()
      expect(pearsonCorrelation([1, 2], [1])).toBeNull()
      expect(pearsonCorrelation([5, 5, 5], [1, 2, 3])).toBeNull()
    })
  })

  describe('linearRegression', () => {
    it('fits exact y = 2x + 1', () => {
      const xs = [0, 1, 2, 3]
      const ys = [1, 3, 5, 7]
      const fit = linearRegression(xs, ys)
      expect(fit).not.toBeNull()
      expect(fit!.slope).toBeCloseTo(2, 5)
      expect(fit!.intercept).toBeCloseTo(1, 5)
      expect(fit!.n).toBe(4)
      const ends = regressionTrendEndpoints(fit!, xs)
      expect(ends![0]).toEqual({ x: 0, y: 1 })
      expect(ends![1]).toEqual({ x: 3, y: 7 })
    })

    it('returns null for n < 2 or constant x', () => {
      expect(linearRegression([1], [2])).toBeNull()
      expect(linearRegression([5, 5, 5], [1, 2, 3])).toBeNull()
    })
  })

  describe('buildCorrelationScatters', () => {
    it('returns phone×latency and caffeine×quality with points + regression', () => {
      const entries = [
        fakeEntry({
          date: new Date(2026, 6, 1),
          attemptSleepTime: new Date(2026, 6, 1, 22, 0),
          estimatedSleepTime: new Date(2026, 6, 1, 22, 20),
          sleepQuality: 8,
          food: { mealBeforeSleep: false, caffeineAmountMg: 0 },
          environment: env({ minutesPhoneBeforeSleep: 10 }),
        }),
        fakeEntry({
          date: new Date(2026, 6, 2),
          attemptSleepTime: new Date(2026, 6, 2, 22, 0),
          estimatedSleepTime: new Date(2026, 6, 2, 22, 40),
          sleepQuality: 6,
          food: { mealBeforeSleep: false, caffeineAmountMg: 100 },
          environment: env({ minutesPhoneBeforeSleep: 40 }),
        }),
        fakeEntry({
          date: new Date(2026, 6, 3),
          attemptSleepTime: new Date(2026, 6, 3, 22, 0),
          estimatedSleepTime: new Date(2026, 6, 3, 23, 0),
          sleepQuality: 4,
          food: { mealBeforeSleep: false, caffeineAmountMg: 200 },
          environment: env({ minutesPhoneBeforeSleep: 70 }),
        }),
      ]

      const scatters = buildCorrelationScatters(entries)
      expect(scatters.map((s) => s.key)).toEqual([
        'phoneMinutesVsLatency',
        'caffeineVsQuality',
      ])

      const phone = scatters[0]
      expect(phone.points).toHaveLength(3)
      expect(phone.points.map((p) => p.x)).toEqual([10, 40, 70])
      expect(phone.points.map((p) => p.y)).toEqual([20, 40, 60])
      expect(phone.regression).not.toBeNull()
      expect(phone.regression!.slope).toBeCloseTo(2 / 3, 5)

      const caffeine = scatters[1]
      expect(caffeine.points).toHaveLength(3)
      expect(caffeine.regression).not.toBeNull()
      expect(caffeine.regression!.slope).toBeCloseTo(-0.02, 5)
    })
  })

  describe('sleepDurationMinutes / Hours', () => {
    it('same-day 04:00 → 12:00 = 480 minutes / 8 hours', () => {
      const entry = fakeEntry({
        date: new Date('2026-07-09T00:00:00.000Z'),
        estimatedSleepTime: new Date('2026-07-09T04:00:00.000Z'),
        wakeTime: new Date('2026-07-09T12:00:00.000Z'),
      })
      expect(sleepDurationMinutes(entry)).toBe(480)
      expect(sleepDurationHours(entry)).toBe(8)
    })

    it('overnight 23:30 → 07:00 = 450 minutes', () => {
      expect(
        sleepDurationMinutes({
          estimatedSleepTime: new Date('2026-07-09T23:30:00.000Z'),
          attemptSleepTime: null,
          bedTime: null,
          wakeTime: new Date('2026-07-10T07:00:00.000Z'),
        })
      ).toBe(450)
    })

    it('returns null when wake missing or before sleep', () => {
      expect(
        sleepDurationMinutes({
          estimatedSleepTime: new Date('2026-07-09T12:00:00.000Z'),
          attemptSleepTime: null,
          bedTime: null,
          wakeTime: new Date('2026-07-09T04:00:00.000Z'),
        })
      ).toBeNull()
      expect(
        sleepDurationMinutes({
          estimatedSleepTime: null,
          attemptSleepTime: null,
          bedTime: null,
          wakeTime: new Date(),
        })
      ).toBeNull()
      expect(
        sleepDurationHours(
          fakeEntry({ date: new Date(2026, 6, 1), wakeTime: null })
        )
      ).toBeNull()
    })
  })

  describe('latencyMinutes / sleepLatencyMinutes', () => {
    it('attempt 22:30 → estimated 23:00 = 30', () => {
      expect(latencyMinutes(twoEntryFixture[0])).toBe(30)
      expect(sleepLatencyMinutes(twoEntryFixture[0])).toBe(30)
    })

    it('returns null without both timestamps or negative span', () => {
      expect(
        latencyMinutes({
          attemptSleepTime: null,
          estimatedSleepTime: new Date(),
        })
      ).toBeNull()
      expect(
        latencyMinutes({
          attemptSleepTime: new Date(2026, 6, 1, 23, 0),
          estimatedSleepTime: new Date(2026, 6, 1, 22, 0),
        })
      ).toBeNull()
    })
  })

  describe('minutesSinceMidnight / clockMinutes', () => {
    it('22:30 → 1350; null input → null / 0', () => {
      expect(minutesSinceMidnight(new Date(2026, 6, 1, 22, 30))).toBe(1350)
      expect(minutesSinceMidnight(null)).toBeNull()
      expect(minutesSinceMidnight(undefined)).toBeNull()
      expect(clockMinutes(new Date(2026, 6, 1, 0, 0))).toBe(0)
    })
  })

  describe('standardDeviation', () => {
    it('known series and edge cases', () => {
      // values [2,4,4,4,5,5,7,9] population variance = 4, stdev = 2
      expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 9)
      expect(standardDeviation([5])).toBe(0)
      expect(standardDeviation([])).toBe(0)
    })
  })

  describe('sleepDebt', () => {
    it('2-entry fixture → 120 minutes (only the 6h night deficits)', () => {
      expect(sleepDebt(twoEntryFixture)).toBe(120)
    })

    it('seven 8h nights → 0', () => {
      const nights = Array.from({ length: 7 }, (_, i) =>
        fakeEntry({
          date: new Date(2026, 6, i + 1),
          estimatedSleepTime: new Date(2026, 6, i + 1, 0, 0),
          wakeTime: new Date(2026, 6, i + 1, 8, 0),
        })
      )
      expect(sleepDebt(nights)).toBe(0)
    })
  })

  describe('cumulative sleep debt (Step 93)', () => {
    function nightHours(date: Date, hours: number) {
      return fakeEntry({
        date,
        estimatedSleepTime: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          0,
          0
        ),
        wakeTime: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          hours,
          0
        ),
      })
    }

    it('5×6h then 1×10h → debt reduces but does not fully zero', () => {
      // 5 × (480−360)=120 → 600; then 10h surplus −120 → 480
      const entries = [
        ...Array.from({ length: 5 }, (_, i) =>
          nightHours(new Date(2026, 0, 1 + i), 6)
        ),
        nightHours(new Date(2026, 0, 6), 10),
      ]

      const series = cumulativeSleepDebtSeries(entries)
      expect(series.map((p) => p.debtMinutes)).toEqual([
        120, 240, 360, 480, 600, 480,
      ])
      expect(series[5].nightDelta).toBe(-120)
      expect(cumulativeSleepDebt(entries)).toBe(480)
      // Not wiped by a single recovery night
      expect(cumulativeSleepDebt(entries)).toBeGreaterThan(0)
    })

    it('surplus never drives debt below 0', () => {
      const entries = [
        nightHours(new Date(2026, 0, 1), 6), // +120
        nightHours(new Date(2026, 0, 2), 10), // −120 → 0
        nightHours(new Date(2026, 0, 3), 10), // −120 → stays 0
      ]
      expect(cumulativeSleepDebtSeries(entries).map((p) => p.debtMinutes)).toEqual([
        120, 0, 0,
      ])
    })
  })

  describe('consistencyScore', () => {
    it('identical bedtimes → 100', () => {
      expect(consistencyScore(twoEntryFixture)).toBe(100)
    })

    it('single bedtime or empty → 100; wildly varying → near 0', () => {
      expect(consistencyScore([fakeEntry({ date: new Date(2026, 6, 1) })])).toBe(
        100
      )
      const wild = [
        fakeEntry({
          date: new Date(2026, 6, 1),
          bedTime: new Date(2026, 6, 1, 0, 0),
        }),
        fakeEntry({
          date: new Date(2026, 6, 2),
          bedTime: new Date(2026, 6, 2, 12, 0),
        }),
      ]
      expect(consistencyScore(wild)).toBeLessThan(20)
    })
  })

  describe('correlateBoolean', () => {
    it('hand fixture: known exact group averages', () => {
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

      expect(result.groupA.n).toBe(5)
      expect(result.groupA.avg).toBe(60)
      expect(result.groupB.n).toBe(3)
      expect(result.groupB.avg).toBe(20)
    })

    it('empty outcome sets → avg null, n 0', () => {
      const result = correlateBoolean(
        [
          { phone: true as boolean | null, latency: null as number | null },
          { phone: false, latency: null },
        ],
        (e) => e.phone,
        (e) => e.latency
      )
      expect(result.groupA).toEqual({ avg: null, n: 0 })
      expect(result.groupB).toEqual({ avg: null, n: 0 })
    })
  })

  describe('computeSummary', () => {
    it('2-entry fixture returns exact expected averages', () => {
      const summary = computeSummary(twoEntryFixture)

      expect(summary.todaySleep).toBe(6)
      expect(summary.avg7day).toBe(7)
      expect(summary.avg30day).toBe(7)
      expect(summary.sleepDebt).toBe(120)
      expect(summary.avgLatency).toBe(45)
      expect(summary.avgBedtime).toBe('22:00')
      expect(summary.avgWakeTime).toBe('06:00')
      expect(summary.consistencyScore).toBe(100)
    })

    it('empty entries → null metrics, zero debt', () => {
      const summary = computeSummary([])
      expect(summary.todaySleep).toBeNull()
      expect(summary.avg7day).toBeNull()
      expect(summary.avgLatency).toBeNull()
      expect(summary.sleepDebt).toBe(0)
    })
  })

  describe('computeAnalyticsSummary', () => {
    it('Pearson factors from mood/food/exercise/environment fixtures', () => {
      const entries = [
        fakeEntry({
          date: new Date(2026, 6, 1),
          sleepQuality: 4,
          mood: { mood: 5, stress: 1, anxiety: 1, motivation: 5 },
          food: { mealBeforeSleep: false, caffeineAmountMg: 0 },
          exercise: { exercise: true, duration: 10 },
          environment: env({ minutesPhoneBeforeSleep: 10 }),
        }),
        fakeEntry({
          date: new Date(2026, 6, 2),
          sleepQuality: 8,
          mood: { mood: 7, stress: 9, anxiety: 9, motivation: 7 },
          food: { mealBeforeSleep: true, caffeineAmountMg: 200 },
          exercise: { exercise: true, duration: 60 },
          environment: env({ minutesPhoneBeforeSleep: 90 }),
        }),
      ]

      const summary = computeAnalyticsSummary(entries)
      expect(summary.entryCount).toBe(2)
      expect(summary.averageSleepQuality).toBe(6)
      expect(summary.correlations.length).toBeGreaterThan(0)
      for (const row of summary.correlations) {
        expect(row.sampleSize).toBe(2)
        expect(typeof row.coefficient).toBe('number')
      }
    })

    it('empty → zero count, null quality, no correlations', () => {
      const summary = computeAnalyticsSummary([])
      expect(summary).toEqual({
        entryCount: 0,
        averageSleepQuality: null,
        correlations: [],
      })
    })
  })

  describe('isWeekend', () => {
    it('Sat/Sun true; Wed false', () => {
      expect(isWeekend(new Date(2026, 0, 10))).toBe(true) // Sat
      expect(isWeekend(new Date(2026, 0, 11))).toBe(true) // Sun
      expect(isWeekend(new Date(2026, 0, 7))).toBe(false) // Wed
    })
  })

  describe('weekendBedtimeShiftHours / formatWeekendBedtimeShift', () => {
    it('weekday 18:00 vs weekend 22:48 → 4.8 hours sentence', () => {
      const entries = [
        ...[5, 6, 7, 8, 9].map((d) =>
          fakeEntry({
            date: new Date(2026, 0, d),
            bedTime: new Date(2026, 0, d, 18, 0),
          })
        ),
        fakeEntry({
          date: new Date(2026, 0, 10),
          bedTime: new Date(2026, 0, 10, 22, 48),
        }),
        fakeEntry({
          date: new Date(2026, 0, 11),
          bedTime: new Date(2026, 0, 11, 22, 48),
        }),
      ]

      expect(weekendBedtimeShiftHours(entries)).toBeCloseTo(4.8, 9)
      expect(formatWeekendBedtimeShift(entries)).toBe(
        'Weekends shift your bedtime by 4.8 hours.'
      )
    })

    it('returns null when one side missing', () => {
      const weekdaysOnly = [
        fakeEntry({
          date: new Date(2026, 0, 5),
          bedTime: new Date(2026, 0, 5, 22, 0),
        }),
      ]
      expect(weekendBedtimeShiftHours(weekdaysOnly)).toBeNull()
      expect(formatWeekendBedtimeShift(weekdaysOnly)).toBeNull()
    })
  })

  describe('weekend jetlag (Step 91)', () => {
    /** Mon–Fri 4 AM bedtime (+ wake); Sat/Sun 3 AM bedtime (+ wake). */
    function jetlagFixture(opts?: {
      weekendBedHour?: number
      weekdayBedHour?: number
      weekendWakeHour?: number
      weekdayWakeHour?: number
    }) {
      const weekendBedHour = opts?.weekendBedHour ?? 3
      const weekdayBedHour = opts?.weekdayBedHour ?? 4
      const weekendWakeHour = opts?.weekendWakeHour ?? 11
      const weekdayWakeHour = opts?.weekdayWakeHour ?? 12
      // 2026-01-05 Mon … 2026-01-11 Sun
      return [
        ...[5, 6, 7, 8, 9].map((d) =>
          fakeEntry({
            date: new Date(2026, 0, d),
            bedTime: new Date(2026, 0, d, weekdayBedHour, 0),
            wakeTime: new Date(2026, 0, d + 1, weekdayWakeHour, 0),
          })
        ),
        fakeEntry({
          date: new Date(2026, 0, 10), // Sat
          bedTime: new Date(2026, 0, 11, weekendBedHour, 0),
          wakeTime: new Date(2026, 0, 11, weekendWakeHour, 0),
        }),
        fakeEntry({
          date: new Date(2026, 0, 11), // Sun → Mon morning
          bedTime: new Date(2026, 0, 12, weekendBedHour, 0),
          wakeTime: new Date(2026, 0, 12, weekendWakeHour, 0),
        }),
      ]
    }

    it('thresholds: minor ≥1h, moderate ≥2h', () => {
      expect(WEEKEND_JETLAG_MINOR_HOURS).toBe(1)
      expect(WEEKEND_JETLAG_MODERATE_HOURS).toBe(2)
      expect(classifyWeekendJetlag(0.5)).toBe('none')
      expect(classifyWeekendJetlag(1)).toBe('minor')
      expect(classifyWeekendJetlag(2)).toBe('moderate')
    })

    it('3 AM Sat/Sun vs 4 AM weekday → minor jetlag (not a normal false positive)', () => {
      const entries = jetlagFixture()
      // Math.abs(mondayBedtime - weekdayAvgBedtime) / 60 → |180 - 240| / 60 = 1
      expect(weekendJetlagHours(entries)).toBeCloseTo(1, 9)

      const detected = detectWeekendJetlag(entries)
      expect(detected).not.toBeNull()
      expect(detected!.severity).toBe('minor')
      expect(detected!.flagged).toBe(true)
      expect(detected!.bedtimeHours).toBeCloseTo(1, 9)
      expect(formatWeekendJetlag(entries)).toBe(
        'Minor weekend jetlag: Sunday night is 1.0h off your weekday average.'
      )

      // Normal night: same schedule weekdays + Sunday → no flag
      const normal = jetlagFixture({
        weekendBedHour: 4,
        weekdayBedHour: 4,
        weekendWakeHour: 12,
        weekdayWakeHour: 12,
      })
      expect(weekendJetlagHours(normal)).toBeCloseTo(0, 9)
      expect(detectWeekendJetlag(normal)!.severity).toBe('none')
      expect(detectWeekendJetlag(normal)!.flagged).toBe(false)
      expect(formatWeekendJetlag(normal)).toBeNull()
    })

    it('≥2h Sunday shift → moderate jetlag sentence', () => {
      const entries = jetlagFixture({
        weekendBedHour: 6,
        weekdayBedHour: 4,
        weekendWakeHour: 14,
        weekdayWakeHour: 12,
      })
      expect(weekendJetlagHours(entries)).toBeCloseTo(2, 9)
      expect(detectWeekendJetlag(entries)!.severity).toBe('moderate')
      expect(formatWeekendJetlag(entries)).toBe(
        'Weekend jetlag: Sunday night is 2.0h off your weekday average.'
      )
    })

    it('buildInsights includes jetlag when flagged', () => {
      const insights = buildInsights(jetlagFixture())
      expect(
        insights.some((s) => s.includes('Minor weekend jetlag'))
      ).toBe(true)
    })
  })

  describe('circadian drift (Step 92)', () => {
    it('linearRegressionSlope matches linearRegression.slope on [x,y] pairs', () => {
      const points: Array<[number, number]> = [
        [0, 0],
        [1, 10],
        [2, 20],
        [3, 30],
      ]
      expect(linearRegressionSlope(points)).toBeCloseTo(10, 5)
      expect(linearRegressionSlope([[0, 1]])).toBeNull()
    })

    /** 21:00 + 10×i → day 13 = 23:10 (stays pre-midnight for minutesSinceMidnight). */
    function driftingLaterEntries() {
      return Array.from({ length: 14 }, (_, i) => {
        const total = 21 * 60 + i * 10
        return fakeEntry({
          date: new Date(2026, 0, 1 + i),
          bedTime: new Date(2026, 0, 1 + i, Math.floor(total / 60), total % 60),
        })
      })
    }

    it('14 days steadily +10 min/day → positive slope flagged as drifting later', () => {
      const entries = driftingLaterEntries()

      const points = entries.map((e, i) => [
        i,
        minutesSinceMidnight(e.bedTime)!,
      ]) as Array<[number, number]>
      const slope = linearRegressionSlope(points)
      expect(slope).toBeCloseTo(10, 5)
      expect(circadianDriftSlope(entries)).toBeCloseTo(10, 5)
      expect(CIRCADIAN_DRIFT_WINDOW_DAYS).toBe(14)

      const detected = detectCircadianDrift(entries)
      expect(detected).not.toBeNull()
      expect(detected!.direction).toBe('later')
      expect(detected!.flagged).toBe(true)
      expect(detected!.n).toBe(14)
      expect(formatCircadianDrift(entries)).toMatch(/drifting later/)
      expect(formatCircadianDrift(entries)).toContain('10')

      // Flat bedtimes → not flagged
      const flat = Array.from({ length: 14 }, (_, i) =>
        fakeEntry({
          date: new Date(2026, 0, 1 + i),
          bedTime: new Date(2026, 0, 1 + i, 22, 0),
        })
      )
      expect(detectCircadianDrift(flat)!.direction).toBe('stable')
      expect(formatCircadianDrift(flat)).toBeNull()
    })

    it('buildInsights includes drifting later sentence', () => {
      expect(
        buildInsights(driftingLaterEntries()).some((s) =>
          s.includes('drifting later')
        )
      ).toBe(true)
    })
  })

  describe('roomTempBucket / optimalRoomTempRange / formatOptimalRoomTemp', () => {
    it('buckets to nearest 2°C', () => {
      expect(roomTempBucket(24)).toBe(24)
      expect(roomTempBucket(25)).toBe(26)
      expect(roomTempBucket(22.4)).toBe(22)
    })

    it('24°C high-quality nights win 24–26°C range', () => {
      const entries = [
        fakeEntry({
          date: new Date(2026, 0, 5),
          sleepQuality: 8,
          environment: env({ roomTemp: 24 }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 6),
          sleepQuality: 9,
          environment: env({ roomTemp: 24.2 }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 7),
          sleepQuality: 5,
          environment: env({ roomTemp: 20 }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 8),
          sleepQuality: 4,
          environment: env({ roomTemp: 28 }),
        }),
      ]

      const best = optimalRoomTempRange(entries)
      expect(best).toMatchObject({
        bucket: 24,
        rangeLow: 24,
        rangeHigh: 26,
      })
      expect(formatOptimalRoomTemp(entries)).toBe(
        'Your optimal room temperature range is 24–26°C.'
      )
      expect(optimalRoomTempRange([])).toBeNull()
      expect(formatOptimalRoomTemp([])).toBeNull()
    })
  })

  describe('sunriseBeforeBedImpact / formatSunriseBeforeBedImpact', () => {
    it('quality 5.2 with sunrise vs 8.1 without (n≥3 each)', () => {
      const withSunrise = [5, 5, 5.6]
      const without = [8, 8, 8.3]
      const entries = [
        ...withSunrise.map((q, i) =>
          fakeEntry({
            date: new Date(2026, 0, 1 + i),
            sleepQuality: q,
            environment: env({ sunlightSeenBeforeSleep: true }),
          })
        ),
        ...without.map((q, i) =>
          fakeEntry({
            date: new Date(2026, 0, 10 + i),
            sleepQuality: q,
            environment: env({ sunlightSeenBeforeSleep: false }),
          })
        ),
      ]

      const impact = sunriseBeforeBedImpact(entries)
      expect(impact).toEqual({
        withSunrise: { avg: 5.2, n: 3 },
        withoutSunrise: { avg: 8.1, n: 3 },
      })
      expect(formatSunriseBeforeBedImpact(entries)).toBe(
        'Average quality with sunrise before sleep: 5.2; without: 8.1.'
      )
    })

    it('suppresses when either side n < 3', () => {
      const entries = [
        fakeEntry({
          date: new Date(2026, 0, 1),
          sleepQuality: 5,
          environment: env({ sunlightSeenBeforeSleep: true }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 2),
          sleepQuality: 8,
          environment: env({ sunlightSeenBeforeSleep: false }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 3),
          sleepQuality: 8,
          environment: env({ sunlightSeenBeforeSleep: false }),
        }),
        fakeEntry({
          date: new Date(2026, 0, 4),
          sleepQuality: 8,
          environment: env({ sunlightSeenBeforeSleep: false }),
        }),
      ]
      expect(sunriseBeforeBedImpact(entries)).toBeNull()
      expect(formatSunriseBeforeBedImpact(entries)).toBeNull()
    })
  })

  describe('computeCorrelations', () => {
    it('phone vs latency: YES avg 60, NO avg 20, n≥3', () => {
      const cards = computeCorrelations(phoneLatencyFixture())
      const phoneLatency = cards.find(
        (c) =>
          c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
      )
      expect(phoneLatency).toBeDefined()
      expect(phoneLatency!.label).toBe('Phone before sleep vs latency')
      expect(phoneLatency!.groupA).toEqual({ label: 'YES', avg: 60, n: 3 })
      expect(phoneLatency!.groupB).toEqual({ label: 'NO', avg: 20, n: 3 })
    })

    it('suppresses when either group n < MIN_CORRELATION_GROUP_N', () => {
      const thin = phoneLatencyFixture().slice(0, 4) // 3 yes + 1 no
      const cards = computeCorrelations(thin)
      expect(
        cards.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
        )
      ).toBeUndefined()
    })

    it('injectable 5th FACTOR surfaces when n≥3 each side', () => {
      const entries = phoneLatencyFixture().map((e, i) =>
        fakeEntry({
          ...e,
          exercise: { exercise: i % 2 === 0, duration: 30 },
        })
      )
      // Ensure 3 true / 3 false for exercised
      const exercised = entries.map((e, i) =>
        fakeEntry({
          ...e,
          exercise: { exercise: i < 3, duration: 30 },
        })
      )
      const cards = computeCorrelations(exercised, [
        ...FACTORS,
        {
          key: 'exercised',
          label: 'Exercised',
          get: (e) => e.exercise?.exercise ?? null,
        },
      ])
      expect(
        cards.some((c) => c.factor === 'exercised' && c.outcome === 'latency')
      ).toBe(true)
    })
  })

  describe('insightActionLabel / toInsightCandidate', () => {
    it('maps known factor keys to verb phrases', () => {
      expect(insightActionLabel('phoneUsedBeforeSleep')).toBe(
        'used your phone before sleep'
      )
      expect(insightActionLabel('mealBeforeSleep')).toBe('ate before sleep')
      expect(insightActionLabel('unknownFactor')).toBe('unknownFactor')
    })

    it('duration → effectMinutes; latency → latencyDiff; quality → null', () => {
      const duration: FactorCorrelation = {
        factor: 'mealBeforeSleep',
        outcome: 'duration',
        label: 'Ate before sleep vs duration',
        groupA: { label: 'YES', avg: 480, n: 5 },
        groupB: { label: 'NO', avg: 420, n: 5 },
      }
      expect(toInsightCandidate(duration)).toEqual({
        label: 'ate before sleep',
        effectMinutes: 60,
      })

      const latency: FactorCorrelation = {
        factor: 'phoneUsedBeforeSleep',
        outcome: 'latency',
        label: 'Phone before sleep vs latency',
        groupA: { label: 'YES', avg: 92, n: 5 },
        groupB: { label: 'NO', avg: 5, n: 5 },
      }
      expect(toInsightCandidate(latency)).toEqual({
        label: 'used your phone before sleep',
        latencyDiff: 87,
      })

      const quality: FactorCorrelation = {
        ...latency,
        outcome: 'quality',
      }
      expect(toInsightCandidate(quality)).toBeNull()
      expect(
        toInsightCandidate({
          ...latency,
          groupA: { label: 'YES', avg: null, n: 0 },
        })
      ).toBeNull()
    })
  })

  describe('insight templates (re-exported)', () => {
    it('insightEffectSize / rankInsightCandidates order by |effect|', () => {
      expect(insightEffectSize({ effectMinutes: 12, latencyDiff: 80 })).toBe(80)
      const ranked = rankInsightCandidates([
        { label: 'small', effectMinutes: 12 },
        { label: 'large', effectMinutes: 80 },
      ])
      expect(ranked[0].effectMinutes).toBe(80)
      expect(insightTemplates).toHaveLength(2)
    })

    it('generateInsightSentences ranks 80 above 25 and caps length', () => {
      const sentences = generateInsightSentences([
        { label: 'small lag', latencyDiff: 25 },
        { label: 'large lag', latencyDiff: 80 },
      ])
      expect(sentences[0]).toContain('80')
      expect(sentences[1]).toContain('25')
      expect(sentences.length).toBeLessThanOrEqual(MAX_RANKED_INSIGHTS)
    })
  })

  describe('generateInsights / buildInsights', () => {
    it('generateInsights embeds exact 87-minute latency gap', () => {
      const correlations: FactorCorrelation[] = [
        {
          factor: 'phoneUsedBeforeSleep',
          outcome: 'latency',
          label: 'Phone before sleep vs latency',
          groupA: { label: 'YES', avg: 92, n: 5 },
          groupB: { label: 'NO', avg: 5, n: 5 },
        },
      ]
      const insights = generateInsights(correlations)
      expect(insights).toEqual([
        'used your phone before sleep increased your average sleep latency by 87 minutes.',
      ])
      expect(generateInsights([
        {
          ...correlations[0],
          groupA: { label: 'YES', avg: 20, n: 5 },
          groupB: { label: 'NO', avg: 10, n: 5 },
        },
      ])).toEqual([])
    })

    it('buildInsights combines correlations + weekend + room + sunrise', () => {
      // Weekday beds 18:00, weekend 22:48 → 4.8h
      // Room 24°C quality 8+ → optimal range
      // Sunrise quality split with n≥3
      const entries: SleepEntryWithRelations[] = []

      for (let d = 5; d <= 9; d++) {
        entries.push(
          fakeEntry({
            date: new Date(2026, 0, d),
            bedTime: new Date(2026, 0, d, 18, 0),
            attemptSleepTime: new Date(2026, 0, d, 22, 0),
            estimatedSleepTime: new Date(2026, 0, d, 22, 60), // 60m latency
            wakeTime: new Date(2026, 0, d + 1, 6, 0),
            sleepQuality: 5,
            environment: env({
              phoneUsedBeforeSleep: true,
              roomTemp: 24,
              sunlightSeenBeforeSleep: true,
            }),
          })
        )
      }
      for (let d = 10; d <= 11; d++) {
        entries.push(
          fakeEntry({
            date: new Date(2026, 0, d),
            bedTime: new Date(2026, 0, d, 22, 48),
            attemptSleepTime: new Date(2026, 0, d, 22, 0),
            estimatedSleepTime: new Date(2026, 0, d, 22, 10),
            wakeTime: new Date(2026, 0, d + 1, 6, 0),
            sleepQuality: 8,
            environment: env({
              phoneUsedBeforeSleep: false,
              roomTemp: 20,
              sunlightSeenBeforeSleep: false,
            }),
          })
        )
      }
      // Extra no-phone / no-sunrise for n≥3
      entries.push(
        fakeEntry({
          date: new Date(2026, 0, 12),
          bedTime: new Date(2026, 0, 12, 18, 0),
          attemptSleepTime: new Date(2026, 0, 12, 22, 0),
          estimatedSleepTime: new Date(2026, 0, 12, 22, 10),
          wakeTime: new Date(2026, 0, 13, 6, 0),
          sleepQuality: 8,
          environment: env({
            phoneUsedBeforeSleep: false,
            roomTemp: 20,
            sunlightSeenBeforeSleep: false,
          }),
        })
      )
      entries.push(
        fakeEntry({
          date: new Date(2026, 0, 13),
          bedTime: new Date(2026, 0, 13, 18, 0),
          attemptSleepTime: new Date(2026, 0, 13, 22, 0),
          estimatedSleepTime: new Date(2026, 0, 13, 22, 10),
          wakeTime: new Date(2026, 0, 14, 6, 0),
          sleepQuality: 8.3,
          environment: env({
            phoneUsedBeforeSleep: false,
            roomTemp: 20,
            sunlightSeenBeforeSleep: false,
          }),
        })
      )

      const insights = buildInsights(entries)
      expect(
        insights.some((s) => s.includes('Weekends shift your bedtime'))
      ).toBe(true)
      expect(
        insights.some((s) => s.includes('optimal room temperature'))
      ).toBe(true)
      expect(
        insights.some((s) => s.includes('sunrise before sleep'))
      ).toBe(true)
    })
  })

  describe('filterEntriesByAnalyticsRange / parseAnalyticsDateRange', () => {
    const now = new Date('2026-07-15T12:00:00.000Z')
    const dated = (iso: string) => fakeEntry({ date: new Date(iso) })

    it('parseAnalyticsDateRange accepts 7d/30d/90d/all, else all', () => {
      expect(parseAnalyticsDateRange('7d')).toBe('7d')
      expect(parseAnalyticsDateRange('30d')).toBe('30d')
      expect(parseAnalyticsDateRange('90d')).toBe('90d')
      expect(parseAnalyticsDateRange('all')).toBe('all')
      expect(parseAnalyticsDateRange('nope')).toBe('all')
      expect(parseAnalyticsDateRange(undefined)).toBe('all')
    })

    it('7d keeps inclusive last 7 UTC calendar days', () => {
      const entries = [
        dated('2026-07-08T00:00:00.000Z'), // out (8 days back from 15 → cutoff 09)
        dated('2026-07-09T00:00:00.000Z'),
        dated('2026-07-15T00:00:00.000Z'),
      ]
      const kept = filterEntriesByAnalyticsRange(entries, '7d', now)
      expect(kept.map((e) => e.date.toISOString().slice(0, 10))).toEqual([
        '2026-07-09',
        '2026-07-15',
      ])
    })

    it('all returns every entry', () => {
      const entries = [dated('2020-01-01T00:00:00.000Z'), dated('2026-07-15T00:00:00.000Z')]
      expect(filterEntriesByAnalyticsRange(entries, 'all', now)).toHaveLength(2)
    })
  })

  describe('createAnalyticsService', () => {
    it('fake reader drives getSummary / getStatsSummary / getCorrelations / getInsights', async () => {
      const entries = phoneLatencyFixture()
      const service = createAnalyticsService({
        findAll: async () => entries,
      })

      expect(service.computeSummary).toBe(computeSummary)
      expect(service.computeCorrelations).toBe(computeCorrelations)

      const analytics = await service.getSummary()
      expect(analytics.entryCount).toBe(entries.length)

      const stats = await service.getStatsSummary()
      expect(stats.avgLatency).not.toBeNull()

      const correlations = await service.getCorrelations()
      expect(
        correlations.some(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
        )
      ).toBe(true)

      const { insights } = await service.getInsights()
      expect(Array.isArray(insights)).toBe(true)
      expect(insights.some((s) => s.includes('latency'))).toBe(true)
    })

    it('getScatterCorrelations respects range — drops old points for 7d', async () => {
      const today = new Date()
      const todayUtc = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
      )
      const mk = (
        daysAgo: number,
        phoneMin: number,
        latencyMin: number,
        caffeine: number,
        quality: number
      ) => {
        const date = new Date(todayUtc)
        date.setUTCDate(date.getUTCDate() - daysAgo)
        const attempt = new Date(date)
        attempt.setUTCHours(22, 0, 0, 0)
        const sleep = new Date(attempt)
        sleep.setUTCMinutes(sleep.getUTCMinutes() + latencyMin)
        return fakeEntry({
          date,
          attemptSleepTime: attempt,
          estimatedSleepTime: sleep,
          sleepQuality: quality,
          food: { mealBeforeSleep: false, caffeineAmountMg: caffeine },
          environment: env({ minutesPhoneBeforeSleep: phoneMin }),
        })
      }

      const entries = [mk(400, 10, 20, 0, 8), mk(1, 40, 40, 100, 6), mk(0, 70, 60, 200, 4)]
      const service = createAnalyticsService({ findAll: async () => entries })

      const all = await service.getScatterCorrelations('all')
      const week = await service.getScatterCorrelations('7d')
      const phoneAll = all.scatters.find((s) => s.key === 'phoneMinutesVsLatency')!
      const phoneWeek = week.scatters.find((s) => s.key === 'phoneMinutesVsLatency')!

      expect(phoneAll.points).toHaveLength(3)
      expect(phoneWeek.points).toHaveLength(2)
      expect(phoneWeek.points.map((p) => p.x)).toEqual([40, 70])
    })
  })
})
