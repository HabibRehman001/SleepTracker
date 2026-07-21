import { ApiError, mobileFetch } from './api'
import { SCHEDULE_CHANGE_EFFECT_MESSAGE } from './scheduleChange'

export type LockedSchedule = {
  _id?: string
  id?: string
  sleepTime: string
  wakeTime: string
  lockedAt: string
  pendingSleepTime?: string | null
  pendingWakeTime?: string | null
  pendingRequestedAt?: string | null
  pendingEffectiveAt?: string | null
  enforcedSleepTime?: string
  enforcedWakeTime?: string
  pendingActive?: boolean
  changeEffectMessage?: string | null
  message?: string
  createdAt?: string
  updatedAt?: string
}

/** GET /schedule — null if none (404). */
export async function fetchSchedule(): Promise<LockedSchedule | null> {
  try {
    return await mobileFetch<LockedSchedule>('/schedule')
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

/**
 * Step 150 — lock schedule once. Existing schedule → error (server also 409).
 */
export async function lockSchedule(
  sleepTime: string,
  wakeTime: string
): Promise<LockedSchedule> {
  const existing = await fetchSchedule()
  if (existing) {
    throw new Error('Schedule already locked')
  }
  try {
    return await mobileFetch<LockedSchedule>('/schedule', {
      method: 'POST',
      body: JSON.stringify({
        sleepTime,
        wakeTime,
        lockedAt: new Date().toISOString(),
      }),
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new Error('Schedule already locked')
    }
    throw err
  }
}

/**
 * Step 151 — request delayed change. Old schedule stays enforced for 24h.
 */
export async function requestScheduleChange(
  sleepTime: string,
  wakeTime: string
): Promise<LockedSchedule> {
  try {
    return await mobileFetch<LockedSchedule>('/schedule/change-request', {
      method: 'POST',
      body: JSON.stringify({ sleepTime, wakeTime }),
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new Error(err.message || 'A schedule change is already pending')
    }
    throw err
  }
}

export { SCHEDULE_CHANGE_EFFECT_MESSAGE }
