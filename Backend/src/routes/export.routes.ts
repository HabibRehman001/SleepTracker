import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import {
  buildExportFilename,
  exportService,
} from '../services/export.service'
import { format } from 'date-fns'

const router = Router()

const MONTH_RE = /^\d{4}-\d{2}$/

function parseMonthQuery(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  if (!MONTH_RE.test(raw)) return undefined
  return raw
}

function requireMonthOrDefault(raw: unknown): string | { error: string } {
  if (raw == null || raw === '') {
    return format(new Date(), 'yyyy-MM')
  }
  if (typeof raw !== 'string' || !MONTH_RE.test(raw)) {
    return { error: 'month must be yyyy-MM' }
  }
  return raw
}

/**
 * Step 104–108 — CSV / JSON / Markdown / PDF exports.
 * Optional `?month=yyyy-MM` scopes the download (PDF always monthly).
 */
router.get(
  '/json',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    if (req.query.month != null && req.query.month !== '' && month == null) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }
    const payload = await exportService.exportJson(month)
    const filename = buildExportFilename(
      'json',
      month ?? format(new Date(), 'yyyy-MM')
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )
    res.status(200).json(payload)
  })
)

router.get(
  '/pdf',
  asyncHandler(async (req, res) => {
    const parsed = requireMonthOrDefault(req.query.month)
    if (typeof parsed === 'object') {
      res.status(400).json({ message: parsed.error })
      return
    }
    const { buffer, filename } = await exportService.exportPdf(parsed)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(buffer)
  })
)

router.get(
  '/markdown',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    if (req.query.month != null && req.query.month !== '' && month == null) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }
    const md = await exportService.exportMarkdown(month)
    const filename = buildExportFilename(
      'md',
      month ?? format(new Date(), 'yyyy-MM')
    )
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(md)
  })
)

router.get(
  '/md',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    if (req.query.month != null && req.query.month !== '' && month == null) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }
    const md = await exportService.exportMarkdown(month)
    const filename = buildExportFilename(
      'md',
      month ?? format(new Date(), 'yyyy-MM')
    )
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(md)
  })
)

router.get(
  '/csv',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    if (req.query.month != null && req.query.month !== '' && month == null) {
      res.status(400).json({ message: 'month must be yyyy-MM' })
      return
    }
    const csv = await exportService.exportCsv(month)
    const filename = buildExportFilename(
      'csv',
      month ?? format(new Date(), 'yyyy-MM')
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(csv)
  })
)

router.get(
  '/sleep-entries.csv',
  asyncHandler(async (req, res) => {
    const month = parseMonthQuery(req.query.month)
    const csv = await exportService.exportSleepEntriesCsv(month)
    const filename = buildExportFilename(
      'csv',
      month ?? format(new Date(), 'yyyy-MM')
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(csv)
  })
)

export default router
