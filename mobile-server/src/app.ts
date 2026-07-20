import cors from 'cors'
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express'
import { lanOnlyMiddleware } from './middleware/lanOnly'
import sessionRoutes from './routes/session.routes'
import scheduleRoutes from './routes/schedule.routes'
import statsRoutes from './routes/stats.routes'
import homeLocationRoutes from './routes/homeLocation.routes'
import authRoutes from './routes/auth.routes'

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8081'

const app = express()

/** Do not trust X-Forwarded-For — client IP must be the real socket peer. */
app.set('trust proxy', false)

/** LAN only (private remote addresses). Account auth is separate JWT layer. */
app.use(lanOnlyMiddleware())

app.use(
  cors({
    origin: corsOrigin,
  })
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'mobile-server',
    message: 'Sleep Lock API is running',
  })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'mobile-server',
    mongo: 'connected',
  })
})

/** Step 127 — activity session create + list for the RN app */
app.use('/sessions', sessionRoutes)
app.use('/api/sessions', sessionRoutes)

/** Step 128 — schedule create-once + get */
app.use('/schedule', scheduleRoutes)
app.use('/api/schedule', scheduleRoutes)

/** Step 129 — monthly stats aggregation */
app.use('/stats', statsRoutes)
app.use('/api/stats', statsRoutes)

/** Step 137 — home lat/lng for geofencing (persisted in Mongo) */
app.use('/home-location', homeLocationRoutes)
app.use('/api/home-location', homeLocationRoutes)

/** Minimal email/password accounts (mobile-server only; not Phase 1 Backend). */
app.use('/auth', authRoutes)
app.use('/api/auth', authRoutes)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' })
})

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({
    message: err instanceof Error ? err.message : 'Server error',
  })
}

app.use(errorHandler)

export default app
