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

router.get(
  '/correlations',
  asyncHandler(async (_req, res) => {
    const entries = await sleepEntryRepository.findAll()
    res.status(200).json(analyticsService.computeCorrelations(entries))
  })
)

router.get(
  '/insights',
  asyncHandler(async (_req, res) => {
    const entries = await sleepEntryRepository.findAll()
    const correlations = analyticsService.computeCorrelations(entries)
    res.status(200).json(analyticsService.generateInsights(correlations))
  })
)

export default router
