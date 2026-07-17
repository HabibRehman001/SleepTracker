import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  createActivitySession,
  listActivitySessions,
} from '../services/session.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

/**
 * POST /sessions — RN pushes each night's detected/enforced session.
 * GET /sessions?range=30d — list sessions in range (default 30d).
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    if (!body?.date || !body?.bedTime || !body?.wakeTime || !body?.source) {
      res.status(400).json({
        message: 'date, bedTime, wakeTime, and source are required',
      })
      return
    }
    try {
      const session = await createActivitySession({
        date: body.date as string,
        bedTime: body.bedTime as string,
        wakeTime: body.wakeTime as string,
        source: body.source as 'baseline-auto' | 'locked-schedule',
        stepsCount:
          typeof body.stepsCount === 'number' ? body.stepsCount : undefined,
        homeArrivalTime:
          body.homeArrivalTime == null
            ? null
            : (body.homeArrivalTime as string),
      })
      res.status(201).json(session)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid session'
      res.status(400).json({ message })
    }
  })
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const range =
      typeof req.query.range === 'string' ? req.query.range : '30d'
    try {
      const sessions = await listActivitySessions(range)
      res.status(200).json({ range, count: sessions.length, sessions })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid range'
      res.status(400).json({ message })
    }
  })
)

export default router
