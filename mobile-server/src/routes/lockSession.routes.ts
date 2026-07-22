import { Router, type Request, type Response, type NextFunction } from 'express'

import { requireAuth, type AuthedRequest } from '../middleware/auth'
import {
  getLockSession,
  upsertLockSession,
} from '../services/lockSession.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

/**
 * GET /lock-session — { session: dto | null } for the authenticated user.
 * PUT /lock-session — { locked, unlockAt? } upsert account-wide sleep lock.
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).auth!.sub
    const session = await getLockSession(userId)
    res.status(200).json({ session })
  })
)

router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).auth!.sub
    const body = req.body as Record<string, unknown>
    if (typeof body.locked !== 'boolean') {
      res.status(400).json({ message: 'locked (boolean) is required' })
      return
    }
    try {
      const session = await upsertLockSession(userId, {
        locked: body.locked,
        unlockAt:
          body.unlockAt === null || body.unlockAt === undefined
            ? null
            : String(body.unlockAt),
      })
      res.status(200).json({ session })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid lock session'
      res.status(400).json({ message })
    }
  })
)

export default router
