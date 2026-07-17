import type { RequestHandler } from 'express'
import { isPrivateOrLocalIp } from '../utils/network'

/**
 * Step 131 — reject clients that are not on a private / loopback address.
 * Complements binding on the LAN: if the port is accidentally forwarded to
 * the public internet, cellular / WAN clients still get 403.
 *
 * Escape hatch: ALLOW_PUBLIC=true (deliberate expose — not the default).
 */
export function lanOnlyMiddleware(): RequestHandler {
  const allowPublic =
    process.env.ALLOW_PUBLIC === 'true' || process.env.ALLOW_PUBLIC === '1'

  return (req, res, next) => {
    if (allowPublic) {
      next()
      return
    }

    const ip = req.socket.remoteAddress ?? req.ip ?? ''
    if (isPrivateOrLocalIp(ip)) {
      next()
      return
    }

    res.status(403).json({
      message: 'LAN only — this API is not exposed to the public internet',
      clientIp: ip || null,
    })
  }
}
