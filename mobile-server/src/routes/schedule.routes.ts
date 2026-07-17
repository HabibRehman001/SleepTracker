import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  createSchedule,
  getSchedule,
  ScheduleConflictError,
  ScheduleNotFoundError,
} from '../services/schedule.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

/**
 * POST /schedule — only once (Step 128 / 150). Second POST → 409.
 * GET /schedule — current locked schedule.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    if (!body?.sleepTime || !body?.wakeTime) {
      res.status(400).json({ message: 'sleepTime and wakeTime are required' })
      return
    }
    try {
      const schedule = await createSchedule({
        sleepTime: String(body.sleepTime),
        wakeTime: String(body.wakeTime),
        lock: body.lock !== false,
      })
      res.status(201).json(schedule)
    } catch (err) {
      if (err instanceof ScheduleConflictError) {
        res.status(409).json({ message: err.message })
        return
      }
      const message = err instanceof Error ? err.message : 'Invalid schedule'
      res.status(400).json({ message })
    }
  })
)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      const schedule = await getSchedule()
      res.status(200).json(schedule)
    } catch (err) {
      if (err instanceof ScheduleNotFoundError) {
        res.status(404).json({ message: err.message })
        return
      }
      throw err
    }
  })
)

export default router
