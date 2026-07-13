import { describe, expect, it } from 'vitest'
import {
  computeSummary,
  consistencyScore,
  correlateBoolean,
  latencyMinutes,
  pearsonCorrelation,
  sleepDebt,
  sleepDurationHours,
  sleepDurationMinutes,
} from './analytics.service'
import type { SleepEntryWithRelations } from '../types'

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

describe('analytics.service (vitest, no DB)', () => {
  describe('pearsonCorrelation', () => {
    it('returns 1 for perfect positive correlation', () => {
      expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 9)
    })

    it('returns -1 for perfect negative correlation', () => {
      expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 9)
    })

    it('returns null for short or mismatched arrays', () => {
      expect(pearsonCorrelation([1], [2])).toBeNull()
      expect(pearsonCorrelation([1, 2], [1])).toBeNull()
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
  })

  describe('latencyMinutes', () => {
    it('attempt 22:30 → estimated 23:00 = 30', () => {
      expect(latencyMinutes(twoEntryFixture[0])).toBe(30)
    })

    it('returns null without both timestamps', () => {
      expect(
        latencyMinutes({ attemptSleepTime: null, estimatedSleepTime: new Date() })
      ).toBeNull()
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

  describe('consistencyScore', () => {
    it('identical bedtimes → 100', () => {
      expect(consistencyScore(twoEntryFixture)).toBe(100)
    })
  })

  describe('correlateBoolean', () => {
    /**
     * Hand-built 10-entry fixture (phone × latency) — exact averages:
     *
     * phone YES (5): latency 40,50,60,70,80 → mean 60, n=5
     * phone NO  (3): latency 10,20,30       → mean 20, n=3
     * skipped (2): factor null; factor true but outcome null
     */
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
  })
})
