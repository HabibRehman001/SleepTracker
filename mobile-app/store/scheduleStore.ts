import { create } from 'zustand'

/** HH:MM — once locked in, schedule drives focus/lock windows. */
export type ClockHm = `${number}${number}:${number}${number}` | string

type ScheduleState = {
  bedtime: ClockHm | null
  waketime: ClockHm | null
  /** True after user confirms schedule (not editable casually). */
  lockedIn: boolean
  setSchedule: (bedtime: ClockHm, waketime: ClockHm) => void
  lockIn: () => void
  clearSchedule: () => void
}

/**
 * Bedtime / waketime once the user locks them in (Step 123).
 */
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  bedtime: null,
  waketime: null,
  lockedIn: false,
  setSchedule: (bedtime, waketime) => {
    if (get().lockedIn) return
    set({ bedtime, waketime })
  },
  lockIn: () => {
    const { bedtime, waketime } = get()
    if (!bedtime || !waketime) return
    set({ lockedIn: true })
  },
  clearSchedule: () =>
    set({ bedtime: null, waketime: null, lockedIn: false }),
}))
