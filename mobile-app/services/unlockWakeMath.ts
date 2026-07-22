/**
 * Step 198 — treat phone unlock (ACTION_USER_PRESENT) as real wake time.
 * Pure helpers for Node contracts; native Android owns the BroadcastReceiver.
 */

export const UNLOCK_WAKE_ACTION = 'ACTION_USER_PRESENT'

/** Manual test note — lock then unlock device within ~1s of USER_PRESENT. */
export const UNLOCK_WAKE_MANUAL_TEST =
  'Start unlock wake monitor (FGS), lock the phone, unlock it — getLastUnlockEventMs should update within ~1s with an accurate timestamp. ACTION_USER_PRESENT is registered at runtime in UnlockWakeMonitorService, not the manifest.'

export type UnlockEvent = {
  atMs: number
  action: typeof UNLOCK_WAKE_ACTION
}

/**
 * Prefer unlock epoch as wake when it falls after bed and looks like morning wake.
 */
export function resolveWakeFromUnlock(input: {
  bedTimeMs: number
  scheduledWakeMs: number
  unlockMs: number | null
  /** Max how early unlock may be vs scheduled wake and still count (ms). */
  earlySlackMs?: number
  /** Max how late unlock may be vs scheduled wake (ms). */
  lateSlackMs?: number
}): { wakeMs: number; source: 'unlock' | 'scheduled' } {
  const early = input.earlySlackMs ?? 3 * 60 * 60 * 1000
  const late = input.lateSlackMs ?? 6 * 60 * 60 * 1000
  const u = input.unlockMs
  if (u == null || !Number.isFinite(u) || u <= input.bedTimeMs) {
    return { wakeMs: input.scheduledWakeMs, source: 'scheduled' }
  }
  if (u < input.scheduledWakeMs - early || u > input.scheduledWakeMs + late) {
    return { wakeMs: input.scheduledWakeMs, source: 'scheduled' }
  }
  return { wakeMs: u, source: 'unlock' }
}

/** Simulated USER_PRESENT record for contract tests (mirrors UnlockEventStore). */
export function recordUnlockEventPure(
  log: UnlockEvent[],
  atMs: number,
  max = 50
): UnlockEvent[] {
  const next = [...log, { atMs, action: UNLOCK_WAKE_ACTION as const }]
  return next.length > max ? next.slice(next.length - max) : next
}

export function lastUnlockMs(log: UnlockEvent[]): number {
  if (!log.length) return -1
  return log[log.length - 1].atMs
}
