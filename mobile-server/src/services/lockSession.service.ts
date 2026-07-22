import { Types } from 'mongoose'

import { LockSession } from '../models/LockSession'

export type LockSessionDTO = {
  locked: boolean
  lockedAt: string | null
  unlockAt: string | null
  updatedAt: string
}

function toDTO(doc: {
  locked: boolean
  lockedAt?: Date | null
  unlockAt?: Date | null
  updatedAt: Date
}): LockSessionDTO {
  return {
    locked: Boolean(doc.locked),
    lockedAt: doc.lockedAt ? doc.lockedAt.toISOString() : null,
    unlockAt: doc.unlockAt ? doc.unlockAt.toISOString() : null,
    updatedAt: doc.updatedAt.toISOString(),
  }
}

/** Effective lock: locked flag and unlockAt still in the future (or unset). */
export function isEffectivelyLocked(session: {
  locked: boolean
  unlockAt?: Date | null
}): boolean {
  if (!session.locked) return false
  if (session.unlockAt && session.unlockAt.getTime() <= Date.now()) {
    return false
  }
  return true
}

export async function getLockSession(
  userId: string
): Promise<LockSessionDTO | null> {
  const doc = await LockSession.findOne({
    userId: new Types.ObjectId(userId),
  }).lean()
  if (!doc) return null

  if (doc.locked && !isEffectivelyLocked(doc)) {
    await LockSession.updateOne(
      { userId: doc.userId },
      { $set: { locked: false } }
    )
    return toDTO({
      ...doc,
      locked: false,
      updatedAt: new Date(),
    })
  }

  return toDTO(doc)
}

export async function upsertLockSession(
  userId: string,
  input: { locked: boolean; unlockAt?: string | null }
): Promise<LockSessionDTO> {
  const unlockAt =
    input.unlockAt != null && input.unlockAt !== ''
      ? new Date(input.unlockAt)
      : null
  if (unlockAt && Number.isNaN(unlockAt.getTime())) {
    throw new Error('unlockAt must be a valid ISO date')
  }

  const now = new Date()
  const doc = await LockSession.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      $set: {
        locked: input.locked,
        unlockAt: input.locked ? unlockAt : null,
        lockedAt: input.locked ? now : null,
      },
      $setOnInsert: { userId: new Types.ObjectId(userId) },
    },
    { upsert: true, new: true }
  )

  return toDTO(doc)
}
