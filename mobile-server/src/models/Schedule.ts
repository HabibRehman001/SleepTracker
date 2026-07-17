import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Locked sleep schedule (Step 126).
 * Once `lockedAt` is set, fields become immutable (enforced in Step 150).
 */
export const scheduleSchema = new Schema(
  {
    sleepTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)'],
    }, // "04:00"
    wakeTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)'],
    }, // "12:00"
    lockedAt: { type: Date, default: null },
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
  // Step 150 will harden this; block field changes after lock for now.
  if (!this.isNew && this.lockedAt != null) {
    const touched = (['sleepTime', 'wakeTime', 'lockedAt'] as const).some(
      (key) => this.isModified(key)
    )
    if (touched) {
      throw new Error('Schedule is locked and cannot be modified (Step 150)')
    }
  }
})

export type ScheduleDoc = InferSchemaType<typeof scheduleSchema>

export const Schedule = model('Schedule', scheduleSchema)
