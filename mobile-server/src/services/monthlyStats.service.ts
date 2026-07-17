import { ActivitySession } from '../models/ActivitySession'
import {
  circularMeanMinutes,
  consistencyScoreFromBedMinutes,
  formatClock,
  minutesSinceMidnight,
} from './clockMath'

export type MonthlyStats = {
  month: string
  sessionCount: number
  avgDurationMinutes: number | null
  avgDurationHours: number | null
  avgBedTime: string | null
  avgWakeTime: string | null
  consistencyScore: number
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

/**
 * Mongo aggregation: group ActivitySessions by calendar month (UTC yyyy-MM),
 * then apply circular bed/wake mean + consistency in JS (Phase 1 concepts).
 */
export async function aggregateMonthlyStats(limit = 12): Promise<MonthlyStats[]> {
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
      avgStepsCount:
        bucket.avgStepsCount != null && Number.isFinite(bucket.avgStepsCount)
          ? Math.round(bucket.avgStepsCount)
          : null,
    }
  })
}
