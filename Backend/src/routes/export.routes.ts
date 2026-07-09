import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { exportService } from '../services/export.service'

const router = Router()

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
