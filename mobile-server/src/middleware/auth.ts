import type { NextFunction, Request, Response } from 'express'

import { verifyToken, type AuthTokenPayload } from '../services/auth.service'

export type AuthedRequest = Request & {
  auth?: AuthTokenPayload
}

/**
 * Optional Bearer JWT — attaches req.auth when valid.
 * Existing LAN routes stay open; use requireAuth on /auth/me.
 */
export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.auth = verifyToken(header.slice(7))
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next()
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }
  try {
    req.auth = verifyToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
