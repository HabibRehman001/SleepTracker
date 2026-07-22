import { ActivitySession } from '../models/ActivitySession'
import {
  circularMeanMinutes,
  consistencyScoreFromBedMinutes,
  formatClock,
  minutesSinceMidnight,
} from './clockMath'
import {
  bedtimeAdherencePercent,
  isNightWithinScheduledBedtime,
} from './improvementVerdictMath'

export type MonthlyStats = {
  month: string
  sessionCount: number
  avgDurationMinutes: number | null
  avgDurationHours: number | null
  avgBedTime: string | null
  avgWakeTime: string | null
  /** Stdev-based 0–100 (legacy display). */
  consistencyScore: number
  /**
   * Step 188 — % of nights within 15 min of scheduled bedtime (quality proxy).
   * null when no schedule or no nights.
   */
  bedtimeAdherencePercent: number | null
  nightsOnSchedule: number
  avgStepsCount: number | null
}

type MonthBucket = {
  _id: string
  sessionCount: number
  avgDurationMs: number | null
  avgStepsCount: number | null
  bedTimes: Date[]
  wakeTimes: Date[]
}

function parseScheduledSleepMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * Mongo aggregation: group ActivitySessions by calendar month (UTC yyyy-MM),
 * then apply circular bed/wake mean + consistency + bedtime adherence in JS.
 */
export async function aggregateMonthlyStats(
  limit = 12,
  options?: { scheduledSleepHHMM?: string | null }
): Promise<MonthlyStats[]> {
  const scheduledMin = parseScheduledSleepMinutes(options?.scheduledSleepHHMM)

  const buckets = await ActivitySession.aggregate<MonthBucket>([
    {
      $addFields: {
        durationMs: { $subtract: ['$wakeTime', '$bedTime'] },
        monthKey: {
          $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' },
        },
      },
    },
    {
      $match: {
        durationMs: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$monthKey',
        sessionCount: { $sum: 1 },
        avgDurationMs: { $avg: '$durationMs' },
        avgStepsCount: { $avg: '$stepsCount' },
        bedTimes: { $push: '$bedTime' },
        wakeTimes: { $push: '$wakeTime' },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: Math.max(1, Math.min(limit, 36)) },
  ])

  return buckets.map((bucket) => {
    const bedMinutes = bucket.bedTimes
      .map((d) => minutesSinceMidnight(new Date(d)))
      .filter((n) => Number.isFinite(n))
    const wakeMinutes = bucket.wakeTimes
      .map((d) => minutesSinceMidnight(new Date(d)))
      .filter((n) => Number.isFinite(n))

    const avgBed = circularMeanMinutes(bedMinutes)
    const avgWake = circularMeanMinutes(wakeMinutes)
    const avgDurationMinutes =
      bucket.avgDurationMs != null && Number.isFinite(bucket.avgDurationMs)
        ? Math.round(bucket.avgDurationMs / 60_000)
        : null

    let nightsOnSchedule = 0
    let adherence: number | null = null
    if (scheduledMin != null && bedMinutes.length > 0) {
      nightsOnSchedule = bedMinutes.filter((m) =>
        isNightWithinScheduledBedtime(m, scheduledMin)
      ).length
      adherence = bedtimeAdherencePercent(nightsOnSchedule, bedMinutes.length)
    }

    return {
      month: bucket._id,
      sessionCount: bucket.sessionCount,
      avgDurationMinutes,
      avgDurationHours:
        avgDurationMinutes != null
          ? Math.round((avgDurationMinutes / 60) * 100) / 100
          : null,
      avgBedTime: avgBed == null ? null : formatClock(avgBed),
      avgWakeTime: avgWake == null ? null : formatClock(avgWake),
      consistencyScore: consistencyScoreFromBedMinutes(bedMinutes),
      bedtimeAdherencePercent: adherence,
      nightsOnSchedule,
      avgStepsCount:
        bucket.avgStepsCount != null && Number.isFinite(bucket.avgStepsCount)
          ? Math.round(bucket.avgStepsCount)
          : null,
    }
  })
}
