import { Router, type Request, type Response, type NextFunction } from 'express'
import { buildMonthComparison } from '../services/comparison.service'
import { aggregateMonthlyStats } from '../services/monthlyStats.service'

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

export default router
