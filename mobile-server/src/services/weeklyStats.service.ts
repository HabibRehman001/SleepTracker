/**
 * Step 203 — weekly aggregation job (passive-ongoing only), computed fresh.
 */
import { ActivitySession } from '../models/ActivitySession'
import { getSchedule, ScheduleNotFoundError } from './schedule.service'
import { buildWeeklyStats, WEEKLY_STATS_DAYS } from './weeklyStatsMath'

/**
 * Load passive-ongoing sessions in the past 7 local days and aggregate.
 * No cache — recomputed on every call from live session documents.
 */
export async function aggregateWeeklyStats(options?: {
  now?: Date
  days?: number
}): Promise<ReturnType<typeof buildWeeklyStats>> {
  const days = options?.days ?? WEEKLY_STATS_DAYS
  const now = options?.now ?? new Date()

  let lockedSleepTime: string | null = null
  try {
    const schedule = await getSchedule()
    lockedSleepTime = String(
      schedule.enforcedSleepTime ?? schedule.sleepTime
    )
  } catch (err) {
    if (!(err instanceof ScheduleNotFoundError)) throw err
  }

  // Wide fetch then filter in pure builder (local calendar window).
  const lookback = new Date(now)
  lookback.setDate(lookback.getDate() - (days + 2))
  lookback.setHours(0, 0, 0, 0)

  const docs = await ActivitySession.find({
    source: 'passive-ongoing',
    date: { $gte: lookback },
  })
    .sort({ date: 1 })
    .lean()

  return buildWeeklyStats({
    sessions: docs.map((d) => ({
      date: d.date as Date,
      bedTime: d.bedTime as Date,
      wakeTime: d.wakeTime as Date,
      source: String(d.source),
    })),
    lockedSleepTime,
    now,
    days,
  })
}
