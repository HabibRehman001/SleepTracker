import { ApiError, mobileFetch } from './api'

export type AccountLockSession = {
  locked: boolean
  lockedAt: string | null
  unlockAt: string | null
  updatedAt: string
}

type LockSessionGetResponse = {
  session: AccountLockSession | null
}

type LockSessionPutResponse = {
  session: AccountLockSession
}

/** True when the account is still in an active sleep-lock window. */
export function isAccountLockActive(
  session: AccountLockSession | null | undefined,
  now = new Date()
): boolean {
  if (!session?.locked) return false
  if (session.unlockAt) {
    const until = new Date(session.unlockAt).getTime()
    if (!Number.isNaN(until) && until <= now.getTime()) return false
  }
  return true
}

/** GET /lock-session — null if never published. */
export async function fetchAccountLockSession(): Promise<AccountLockSession | null> {
  try {
    const body = await mobileFetch<LockSessionGetResponse>('/lock-session')
    return body.session ?? null
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
      return null
    }
    throw err
  }
}

/** PUT /lock-session — publish this device’s lock state for the account. */
export async function publishAccountLockSession(input: {
  locked: boolean
  unlockAt?: string | null
}): Promise<AccountLockSession | null> {
  try {
    const body = await mobileFetch<LockSessionPutResponse>('/lock-session', {
      method: 'PUT',
      body: JSON.stringify({
        locked: input.locked,
        unlockAt: input.unlockAt ?? null,
      }),
    })
    return body.session
  } catch (err) {
    // Not signed in / offline — local lock still applies on this device.
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      return null
    }
    console.warn('[lock-session] publish failed', err)
    return null
  }
}
