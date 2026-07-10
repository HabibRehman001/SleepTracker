import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { exportService } from '../services/export.service'

const router = Router()

/**
 * Step 41 stubs — full export polish lands in steps 104–106 (Phase 1K).
 * Existing /sleep-entries.csv remains the working CSV path for now.
 */
router.get(
  '/json',
  asyncHandler(async (_req, res) => {
    const stub = await exportService.exportJsonStub()
    res.status(200).json(stub)
  })
)

router.get(
  '/csv',
  asyncHandler(async (_req, res) => {
    const stub = await exportService.exportCsvStub()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sleeptracker-export-stub.csv"'
    )
    res.status(200).send(stub)
  })
)

router.get(
  '/sleep-entries.csv',
  asyncHandler(async (_req, res) => {
    const csv = await exportService.exportSleepEntriesCsv()
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sleep-entries.csv"'
    )
    res.status(200).send(csv)
  })
)

export default router
