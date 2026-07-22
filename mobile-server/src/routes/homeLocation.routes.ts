import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  getHomeLocationOrNull,
  upsertHomeLocation,
} from '../services/homeLocation.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

/**
 * GET /home-location — { home: dto | null } always 200 (no 404 when unset).
 * PUT /home-location — upsert { latitude, longitude } (Step 137).
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const home = await getHomeLocationOrNull()
    res.status(200).json({ home })
  })
)

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    const latitude = Number(body?.latitude)
    const longitude = Number(body?.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({ message: 'latitude and longitude are required' })
      return
    }
    try {
      const home = await upsertHomeLocation({
        latitude,
        longitude,
        label: typeof body.label === 'string' ? body.label : undefined,
      })
      res.status(200).json(home)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid home location'
      res.status(400).json({ message })
    }
  })
)

/** Also accept POST as alias for upsert (mobile clients). */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    const latitude = Number(body?.latitude)
    const longitude = Number(body?.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({ message: 'latitude and longitude are required' })
      return
    }
    try {
      const home = await upsertHomeLocation({
        latitude,
        longitude,
        label: typeof body.label === 'string' ? body.label : undefined,
      })
      res.status(201).json(home)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid home location'
      res.status(400).json({ message })
    }
  })
)

export default router
