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
  '/:id',
  asyncHandler(async (req, res) => {
    const experiment = await experimentService.getById(String(req.params.id))
    res.status(200).json(experiment)
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const experiment = await experimentService.create(req.body)
    res.status(201).json(experiment)
  })
)

export default router
