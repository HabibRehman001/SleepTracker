import { Router, type Request, type Response, type NextFunction } from 'express'

import { requireAuth, type AuthedRequest } from '../middleware/auth'
import * as authService from '../services/auth.service'

const router = Router()

function statusOf(err: unknown): number {
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  ) {
    return (err as { status: number }).status
  }
  return 500
}

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body ?? {}
    const result = await authService.signup(
      typeof email === 'string' ? email : '',
      typeof password === 'string' ? password : '',
      typeof name === 'string' ? name : undefined
    )
    res.status(201).json(result)
  } catch (err) {
    const status = statusOf(err)
    if (status >= 400 && status < 500) {
      res.status(status).json({
        message: err instanceof Error ? err.message : 'Signup failed',
      })
      return
    }
    next(err)
  }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {}
    const result = await authService.login(
      typeof email === 'string' ? email : '',
      typeof password === 'string' ? password : ''
    )
    res.status(200).json(result)
  } catch (err) {
    const status = statusOf(err)
    if (status >= 400 && status < 500) {
      res.status(status).json({
        message: err instanceof Error ? err.message : 'Login failed',
      })
      return
    }
    next(err)
  }
})

router.get(
  '/me',
  requireAuth,
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getUserById(req.auth!.sub)
      if (!user) {
        res.status(401).json({ message: 'User not found' })
        return
      }
      res.status(200).json({ user })
    } catch (err) {
      next(err)
    }
  }
)

export default router
