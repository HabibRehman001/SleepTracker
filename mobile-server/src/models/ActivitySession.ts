import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * How the session was produced (Step 126 / 201):
 * - baseline-auto — early detection nights
 * - locked-schedule — what the lock enforced
 * - passive-ongoing — what continuous detection observed (actual)
 */
export const ACTIVITY_SOURCES = [
  'baseline-auto',
  'locked-schedule',
  'passive-ongoing',
] as const
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number]

/**
 * One night / activity window logged by the mobile app (Step 126).
 * Distinct from Phase 1 Prisma SleepEntry — enforcement telemetry only.
 * Step 201: same calendar night may have both passive-ongoing and
 * locked-schedule rows (compare actual vs enforced).
 */
export const activitySessionSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    bedTime: { type: Date, required: true },
    wakeTime: { type: Date, required: true },
    source: {
      type: String,
      enum: ACTIVITY_SOURCES,
      required: true,
    },
    stepsCount: { type: Number, min: 0, default: 0 },
    homeArrivalTime: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'activity_sessions',
  }
)

/** One row per sleep-day × source so passive and locked coexist. */
activitySessionSchema.index({ date: 1, source: 1 }, { unique: true })

export type ActivitySessionDoc = InferSchemaType<typeof activitySessionSchema>

export const ActivitySession = model('ActivitySession', activitySessionSchema)
