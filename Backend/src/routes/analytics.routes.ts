import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { createAnalyticsService } from '../services/analytics.service'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'

const router = Router()
const analyticsService = createAnalyticsService(sleepEntryRepository)

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const summary = await analyticsService.getSummary()
    res.status(200).json(summary)
  })
)

export default router
