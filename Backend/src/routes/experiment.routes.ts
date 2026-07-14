import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { experimentService } from '../services/experiment.service'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const experiments = await experimentService.list()
    res.status(200).json(experiments)
  })
)

router.get(
  '/:id/comparison',
  asyncHandler(async (req, res) => {
    // Step 98 — before/after outcome means + diffs
    const comparison = await experimentService.getComparison(
      String(req.params.id)
    )
    res.status(200).json(comparison)
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const experiment = await experimentService.getById(String(req.params.id))
    res.status(200).json(experiment)
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Step 97 — { name, startDate, endDate? } (endDate optional / open-ended)
    const experiment = await experimentService.create(req.body)
    res.status(201).json(experiment)
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    // Step 97 — DELETE /experiments/:id
    await experimentService.delete(String(req.params.id))
    res.status(204).send()
  })
)

export default router
