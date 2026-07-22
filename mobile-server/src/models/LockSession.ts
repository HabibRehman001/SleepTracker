import { Schema, model, type InferSchemaType, Types } from 'mongoose'

/**
 * Account-wide sleep lock session — any device logging into this user
 * mirrors the locked UI until unlock (or unlockAt passes).
 */
export const lockSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    locked: { type: Boolean, required: true, default: false },
    lockedAt: { type: Date, default: null },
    unlockAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'lock_sessions',
  }
)

export type LockSessionDoc = InferSchemaType<typeof lockSessionSchema> & {
  userId: Types.ObjectId
}

export const LockSession = model('LockSession', lockSessionSchema)
