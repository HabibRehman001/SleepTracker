import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  buildExportFilename,
  exportPhase1Json,
} from '../services/export.service'

const router = Router()

const MONTH_RE = /^\d{4}-\d{2}$/

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

function parseMonthQuery(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  if (!MONTH_RE.test(raw)) return undefined
  return raw
}

function currentUtcMonth(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * GET /export/json — Phase 1 Step 105 shape
 * { format, exportedAt, entryCount, entries[] }
 * Optional ?month=yyyy-MM
 */
router.get(
  '/json',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    if (req.query.month != null && req.query.month !== '' && month == null) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }
    const payload = await exportPhase1Json(month)
    const filename = buildExportFilename('json', month ?? currentUtcMonth())
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )
    res.status(200).json(payload)
  })
)

export default router
