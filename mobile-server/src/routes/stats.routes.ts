import { Router, type Request, type Response, type NextFunction } from 'express'
import { buildMonthComparison } from '../services/comparison.service'
import { aggregateMonthlyStats } from '../services/monthlyStats.service'
import { listScheduleAdherence } from '../services/scheduleAdherence.service'
import { aggregateWeeklyStats } from '../services/weeklyStats.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

/**
 * GET /stats/monthly?limit=12 — sessions grouped by month with
 * avg bed/wake, duration, consistency (Step 129).
 */
router.get(
  '/monthly',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 12
    const limit = Number.isFinite(raw) ? raw : 12
    const months = await aggregateMonthlyStats(limit)
    res.status(200).json({
      count: months.length,
      months,
    })
  })
)

/**
 * GET /stats/comparison — this month vs last month + improved + deltas (Step 130).
 * Optional ?month=yyyy-MM to pin the "this month" key (UTC).
 */
router.get(
  '/comparison',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.month === 'string' ? req.query.month.trim() : ''
    const month = /^\d{4}-\d{2}$/.test(raw) ? raw : undefined
    const comparison = await buildMonthComparison(month)
    res.status(200).json(comparison)
  })
)

/**
 * GET /stats/adherence?range=30d — bedtime drift vs locked schedule (Step 202).
 * Each passive-ongoing night → adherenceMinutes (positive = late).
 */
router.get(
  '/adherence',
  asyncHandler(async (req, res) => {
    const range =
      typeof req.query.range === 'string' ? req.query.range : '30d'
    try {
      const result = await listScheduleAdherence(range)
      res.status(200).json({
        range,
        sleepTime: result.sleepTime,
        count: result.count,
        nights: result.nights.map((n) => ({
          sleepDayKey: n.sleepDayKey,
          date: n.date,
          adherenceMinutes: n.adherenceMinutes,
          passiveBedTime: n.passiveBedTime,
          lockedSleepAt: n.lockedSleepAt,
          wakeTime: n.wakeTime,
        })),
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid adherence query'
      res.status(400).json({ message })
    }
  })
)

/**
 * GET /stats/weekly — past 7 days of passive-ongoing nights + avg adherence
 * and avg duration (Step 203). Computed fresh each request.
 */
router.get(
  '/weekly',
  asyncHandler(async (_req, res) => {
    const weekly = await aggregateWeeklyStats()
    res.status(200).json({
      from: weekly.from,
      to: weekly.to,
      days: weekly.days,
      nightCount: weekly.nightCount,
      avgDurationMinutes: weekly.avgDurationMinutes,
      avgAdherenceMinutes: weekly.avgAdherenceMinutes,
      lockedSleepTime: weekly.lockedSleepTime,
      nights: weekly.nights.map((n) => ({
        sleepDayKey: n.sleepDayKey,
        date: n.date,
        bedTime: n.bedTime,
        wakeTime: n.wakeTime,
        durationMinutes: n.durationMinutes,
        adherenceMinutes: n.adherenceMinutes,
      })),
    })
  })
)

export default router
