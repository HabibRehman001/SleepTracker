import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { createAnalyticsService } from '../services/analytics.service'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import {
  filterEntriesByAnalyticsRange,
  parseAnalyticsDateRange,
} from '../utils/analyticsRange'

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
  asyncHandler(async (req, res) => {
    const range = parseAnalyticsDateRange(req.query.range)
    const entries = filterEntriesByAnalyticsRange(
      await sleepEntryRepository.findAll(),
      range
    )
    res.status(200).json(analyticsService.computeCorrelations(entries))
  })
)

router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    // Step 78 — { insights: string[] }, ranked by effect size (Step 77)
    // Step 90 — optional ?range=7d|30d|90d|all
    const range = parseAnalyticsDateRange(req.query.range)
    const body = await analyticsService.getInsights(range)
    res.status(200).json(body)
  })
)

router.get(
  '/scatter',
  asyncHandler(async (req, res) => {
    // Step 86 — { scatters: [{ points, regression }] }
    // Step 90 — optional ?range=7d|30d|90d|all
    const range = parseAnalyticsDateRange(req.query.range)
    const body = await analyticsService.getScatterCorrelations(range)
    res.status(200).json(body)
  })
)

router.get(
  '/patterns',
  asyncHandler(async (req, res) => {
    // Step 96 — { warnings, highlights } for Patterns Detected card
    const range = parseAnalyticsDateRange(req.query.range)
    const body = await analyticsService.getSmartPatterns(range)
    res.status(200).json(body)
  })
)

export default router
