import express from 'express'
import cors from 'cors'
import sleepEntryRoutes from './routes/sleepEntry.routes'
import experimentRoutes from './routes/experiment.routes'
import analyticsRoutes from './routes/analytics.routes'
import exportRoutes from './routes/export.routes'
import { errorHandler, notFound } from './middleware/errorMiddleware'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'SleepTracker API is running' })
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'SleepTracker API is running' })
})

app.use('/api/sleep-entries', sleepEntryRoutes)
app.use('/api/experiments', experimentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/export', exportRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
