import { create } from 'zustand'

import {
  isPendingChangeActive,
  resolveEnforcedSchedule,
} from '../services/scheduleChange'

/** HH:MM — once locked in, schedule drives focus/lock windows. */
export type ClockHm = `${number}${number}:${number}${number}` | string

type ScheduleState = {
  bedtime: ClockHm | null
  waketime: ClockHm | null
  lockedIn: boolean
  lockedAt: string | null
  pendingSleepTime: ClockHm | null
  pendingWakeTime: ClockHm | null
  pendingRequestedAt: string | null
  pendingEffectiveAt: string | null
  setSchedule: (bedtime: ClockHm, waketime: ClockHm) => void
  lockIn: (lockedAt?: string | Date | null) => void
  applyLockedSchedule: (
    sleepTime: ClockHm,
    wakeTime: ClockHm,
    lockedAt: string | Date
  ) => void
  /** Step 151 — store a delayed change; enforced times stay on bedtime/waketime. */
  applyPendingChange: (
    sleepTime: ClockHm,
    wakeTime: ClockHm,
    effectiveAt: string | Date,
    requestedAt?: string | Date
  ) => void
  clearPendingChange: () => void
  /** Bed/wake used for soft-lock enforcement (old until delay elapses). */
  getEnforcedTimes: (now?: Date) => { bedtime: ClockHm; waketime: ClockHm } | null
  /** Promote pending onto core times when the 24h delay has elapsed. */
  promoteDuePending: (now?: Date) => boolean
  clearSchedule: () => void
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

/**
 * Bedtime / waketime once the user locks them in (Steps 123 / 150 / 151).
 */
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  bedtime: null,
  waketime: null,
  lockedIn: false,
  lockedAt: null,
  pendingSleepTime: null,
  pendingWakeTime: null,
  pendingRequestedAt: null,
  pendingEffectiveAt: null,

  setSchedule: (bedtime, waketime) => {
    if (get().lockedIn) return
    set({ bedtime, waketime })
  },

  lockIn: (lockedAt) => {
    const { bedtime, waketime, lockedIn } = get()
    if (lockedIn) return
    if (!bedtime || !waketime) return
    set({
      lockedIn: true,
      lockedAt: lockedAt == null ? new Date().toISOString() : toIso(lockedAt),
    })
  },

  applyLockedSchedule: (sleepTime, wakeTime, lockedAt) => {
    set({
      bedtime: sleepTime,
      waketime: wakeTime,
      lockedIn: true,
      lockedAt: toIso(lockedAt),
      pendingSleepTime: null,
      pendingWakeTime: null,
      pendingRequestedAt: null,
      pendingEffectiveAt: null,
    })
  },

  applyPendingChange: (sleepTime, wakeTime, effectiveAt, requestedAt) => {
    if (!get().lockedIn) return
    set({
      pendingSleepTime: sleepTime,
      pendingWakeTime: wakeTime,
      pendingEffectiveAt: toIso(effectiveAt),
      pendingRequestedAt: toIso(requestedAt ?? new Date()),
    })
  },

  clearPendingChange: () =>
    set({
      pendingSleepTime: null,
      pendingWakeTime: null,
      pendingRequestedAt: null,
      pendingEffectiveAt: null,
    }),

  getEnforcedTimes: (now = new Date()) => {
    const s = get()
    if (!s.bedtime || !s.waketime) return null
    const enforced = resolveEnforcedSchedule(
      {
        sleepTime: s.bedtime,
        wakeTime: s.waketime,
        pendingSleepTime: s.pendingSleepTime,
        pendingWakeTime: s.pendingWakeTime,
        pendingEffectiveAt: s.pendingEffectiveAt,
      },
      now
    )
    return { bedtime: enforced.sleepTime, waketime: enforced.wakeTime }
  },

  promoteDuePending: (now = new Date()) => {
    const s = get()
    if (!s.bedtime || !s.waketime) return false
    const enforced = resolveEnforcedSchedule(
      {
        sleepTime: s.bedtime,
        wakeTime: s.waketime,
        pendingSleepTime: s.pendingSleepTime,
        pendingWakeTime: s.pendingWakeTime,
        pendingEffectiveAt: s.pendingEffectiveAt,
      },
      now
    )
    if (!enforced.fromPending) return false
    set({
      bedtime: enforced.sleepTime,
      waketime: enforced.wakeTime,
      lockedAt: now.toISOString(),
      pendingSleepTime: null,
      pendingWakeTime: null,
      pendingRequestedAt: null,
      pendingEffectiveAt: null,
    })
    return true
  },

  clearSchedule: () =>
    set({
      bedtime: null,
      waketime: null,
      lockedIn: false,
      lockedAt: null,
      pendingSleepTime: null,
      pendingWakeTime: null,
      pendingRequestedAt: null,
      pendingEffectiveAt: null,
    }),
}))

export function selectPendingActive(
  state: ScheduleState,
  now = new Date()
): boolean {
  if (!state.pendingSleepTime || !state.pendingWakeTime || !state.pendingEffectiveAt) {
    return false
  }
  return isPendingChangeActive(
    {
      sleepTime: state.bedtime ?? '',
      wakeTime: state.waketime ?? '',
      pendingSleepTime: state.pendingSleepTime,
      pendingWakeTime: state.pendingWakeTime,
      pendingEffectiveAt: state.pendingEffectiveAt,
    },
    now
  )
}
