import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateBody } from '../middleware/validate'
import { sleepEntrySchema } from '../schemas/sleepEntry.schema'
import { sleepEntryService } from '../services/sleepEntry.service'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const entries = await sleepEntryService.list()
    res.status(200).json(entries)
  })
)

router.get(
  '/:date',
  asyncHandler(async (req, res) => {
    const entry = await sleepEntryService.getByDate(String(req.params.date))
    res.status(200).json(entry)
  })
)

router.put(
  '/:date',
  validateBody(sleepEntrySchema),
  asyncHandler(async (req, res) => {
    const entry = await sleepEntryService.upsertByDate(
      String(req.params.date),
      req.body
    )
    res.status(200).json(entry)
  })
)

export default router
