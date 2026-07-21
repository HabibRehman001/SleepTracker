import { Schema, model, type InferSchemaType } from 'mongoose'

const CLOCK_HM = /^([01]\d|2[0-3]):[0-5]\d$/

function optionalClock(value: unknown) {
  return value == null || value === '' || CLOCK_HM.test(String(value))
}

/**
 * Locked sleep schedule (Steps 126 / 150 / 151).
 * Core sleep/wake are immutable except when a due pending change is promoted.
 * Pending fields hold a 24h-delayed override request.
 */
export const scheduleSchema = new Schema(
  {
    sleepTime: {
      type: String,
      required: true,
      match: [CLOCK_HM, 'Use HH:MM (24h)'],
    },
    wakeTime: {
      type: String,
      required: true,
      match: [CLOCK_HM, 'Use HH:MM (24h)'],
    },
    lockedAt: { type: Date, required: true },
    pendingSleepTime: {
      type: String,
      default: null,
      validate: {
        validator: optionalClock,
        message: 'Use HH:MM (24h)',
      },
    },
    pendingWakeTime: {
      type: String,
      default: null,
      validate: {
        validator: optionalClock,
        message: 'Use HH:MM (24h)',
      },
    },
    pendingRequestedAt: { type: Date, default: null },
    pendingEffectiveAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'schedules',
  }
)

scheduleSchema.virtual('isLocked').get(function () {
  return this.lockedAt != null
})

scheduleSchema.pre('save', function () {
  if (this.isNew) return
  const allowCore = Boolean(
    (this as { $locals?: { allowCoreUpdate?: boolean } }).$locals
      ?.allowCoreUpdate
  )
  if (allowCore) return
  const touched = (['sleepTime', 'wakeTime', 'lockedAt'] as const).some((key) =>
    this.isModified(key)
  )
  if (touched) {
    throw new Error('Schedule is locked and cannot be modified (Step 150)')
  }
})

export type ScheduleDoc = InferSchemaType<typeof scheduleSchema>

export const Schedule = model('Schedule', scheduleSchema)
