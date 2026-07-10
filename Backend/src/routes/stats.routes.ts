import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { createAnalyticsService } from '../services/analytics.service'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'

const router = Router()
const analyticsService = createAnalyticsService(sleepEntryRepository)

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const entries = await sleepEntryRepository.findAll()
    res.status(200).json(analyticsService.computeSummary(entries))
  })
)

export default router
