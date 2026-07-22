import { Router, type Request, type Response, type NextFunction } from 'express'
import { ACTIVITY_SOURCES } from '../models/ActivitySession'
import {
  createActivitySession,
  formatHomeArrivalHHMM,
  listActivitySessions,
  upsertHomeArrivalForSleepDay,
} from '../services/session.service'

const router = Router()

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next)
  }
}

function parseSourceQuery(
  value: unknown
): (typeof ACTIVITY_SOURCES)[number] | undefined {
  if (typeof value !== 'string' || value === '') return undefined
  if ((ACTIVITY_SOURCES as readonly string[]).includes(value)) {
    return value as (typeof ACTIVITY_SOURCES)[number]
  }
  return undefined
}

/**
 * POST /sessions — RN pushes each night's detected/enforced session.
 * PUT /sessions/home-arrival — Step 175 persist homeArrivalTime for sleep day.
 * GET /sessions?range=30d&source=passive-ongoing — list (optional source filter).
 */
router.put(
  '/home-arrival',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    if (body?.homeArrivalTime == null || body.homeArrivalTime === '') {
      res.status(400).json({ message: 'homeArrivalTime is required' })
      return
    }
    try {
      const rawSource =
        typeof body.source === 'string' ? body.source : undefined
      const source =
        rawSource &&
        (ACTIVITY_SOURCES as readonly string[]).includes(rawSource)
          ? (rawSource as (typeof ACTIVITY_SOURCES)[number])
          : undefined
      const session = await upsertHomeArrivalForSleepDay({
        homeArrivalTime: body.homeArrivalTime as string,
        bedTime:
          typeof body.bedTime === 'string' ? body.bedTime : undefined,
        wakeTime:
          typeof body.wakeTime === 'string' ? body.wakeTime : undefined,
        source,
      })
      const arrival =
        session.homeArrivalTime instanceof Date
          ? session.homeArrivalTime
          : session.homeArrivalTime
            ? new Date(session.homeArrivalTime as string)
            : null
      res.status(200).json({
        session,
        homeArrivalTime: arrival?.toISOString() ?? null,
        homeArrivalHHMM: arrival ? formatHomeArrivalHHMM(arrival) : null,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid home arrival'
      res.status(400).json({ message })
    }
  })
)

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
        source: body.source as (typeof ACTIVITY_SOURCES)[number],
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
    const sourceParam = parseSourceQuery(req.query.source)
    if (
      typeof req.query.source === 'string' &&
      req.query.source !== '' &&
      sourceParam == null
    ) {
      res.status(400).json({
        message: `source must be one of: ${ACTIVITY_SOURCES.join(', ')}`,
      })
      return
    }
    try {
      const sessions = await listActivitySessions(range, sourceParam)
      res.status(200).json({
        range,
        source: sourceParam ?? null,
        count: sessions.length,
        sessions,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid range'
      res.status(400).json({ message })
    }
  })
)

export default router
