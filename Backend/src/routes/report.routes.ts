import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import { buildMonthOverMonthCompare } from '../services/monthlyReport'

const router = Router()

const MONTH_RE = /^\d{4}-\d{2}$/

/**
 * Step 103 — this month vs last month for the Reports page.
 * GET /api/reports/compare?month=yyyy-MM  (month optional; defaults to now)
 */
router.get(
  '/compare',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.month === 'string' ? req.query.month : undefined
    if (raw != null && !MONTH_RE.test(raw)) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }

    const entries = await sleepEntryRepository.findAll()
    res.status(200).json(buildMonthOverMonthCompare(entries, raw))
  })
)

export default router
