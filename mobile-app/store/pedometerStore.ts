import { create } from 'zustand'

import {
  addActivityMinute,
  loadActivityMinutes,
  saveActivityMinutes,
} from '../services/activityHistory'
import {
  cadenceFromStepDelta,
  classifyActivity,
  type ActivityType,
} from '../services/activityClassification'
import {
  getHistoricalDaySteps,
  getTodayStepCount,
  getYesterdayStepCount,
  isPedometerAvailable,
  stopLiveStepCount,
  watchLiveStepCount,
  type HistoricalDaySteps,
} from '../services/pedometer'
import type { ActivityMinutes } from '../services/activityScreenMath'

type PedometerState = {
  /** Hardware pedometer present on this device. */
  available: boolean | null
  /** Live steps since watch started (Step 181 watchStepCount). */
  liveSteps: number
  /** Recent cadence (steps/min) from the live watch window (Step 183). */
  stepsPerMinute: number | null
  /** walk | jog | run from cadence. */
  activityType: ActivityType | null
  /** Tracked walk/jog/run minutes today (Step 184). */
  activityMinutes: ActivityMinutes
  /** Steps since local midnight (getStepCountAsync), when supported. */
  todaySteps: number | null
  /** Yesterday whole-day total from OS history (Step 182). */
  yesterdaySteps: number | null
  yesterdayRange: { start: string; end: string } | null
  historical: HistoricalDaySteps | null
  watching: boolean
  lastError: string | null
  hydrateAvailability: () => Promise<boolean>
  refreshTodaySteps: () => Promise<void>
  /** Fetch yesterday (and optional daysAgo) from OS step history. */
  refreshHistoricalSteps: (daysAgo?: number) => Promise<void>
  startWatch: () => Promise<void>
  stopWatch: () => void
  resetLive: () => void
}

/** Cadence sample anchor for Step 183. */
let cadenceAnchor: { steps: number; at: number } | null = null
let minutesTimer: ReturnType<typeof setInterval> | null = null

function clearMinutesTimer() {
  if (minutesTimer) {
    clearInterval(minutesTimer)
    minutesTimer = null
  }
}

/**
 * Native pedometer UI state (Steps 181–184).
 */
export const usePedometerStore = create<PedometerState>((set, get) => ({
  available: null,
  liveSteps: 0,
  stepsPerMinute: null,
  activityType: null,
  activityMinutes: { walk: 0, jog: 0, run: 0 },
  todaySteps: null,
  yesterdaySteps: null,
  yesterdayRange: null,
  historical: null,
  watching: false,
  lastError: null,

  hydrateAvailability: async () => {
    const available = await isPedometerAvailable()
    set({ available, lastError: available ? null : 'Pedometer unavailable' })
    return available
  },

  refreshTodaySteps: async () => {
    const steps = await getTodayStepCount()
    set({ todaySteps: steps })
  },

  refreshHistoricalSteps: async (daysAgo = 1) => {
    try {
      const day =
        daysAgo === 1
          ? await getYesterdayStepCount()
          : await getHistoricalDaySteps(daysAgo)
      if (!day) {
        set({
          yesterdaySteps: daysAgo === 1 ? null : get().yesterdaySteps,
          yesterdayRange: daysAgo === 1 ? null : get().yesterdayRange,
          historical: null,
          lastError:
            get().available === false
              ? 'Pedometer unavailable'
              : 'Historical steps unavailable (OS may not expose getStepCountAsync)',
        })
        return
      }
      set({
        historical: day,
        ...(daysAgo === 1
          ? {
              yesterdaySteps: day.steps,
              yesterdayRange: {
                start: day.start.toISOString(),
                end: day.end.toISOString(),
              },
              lastError: null,
            }
          : { lastError: null }),
      })
    } catch (err) {
      set({
        lastError:
          err instanceof Error ? err.message : 'Historical steps failed',
      })
    }
  },

  startWatch: async () => {
    const available =
      get().available ?? (await get().hydrateAvailability())
    if (!available) {
      set({
        watching: false,
        lastError: 'Pedometer unavailable on this device',
      })
      return
    }
    stopLiveStepCount()
    clearMinutesTimer()
    cadenceAnchor = { steps: 0, at: Date.now() }
    const loaded = await loadActivityMinutes()
    set({
      liveSteps: 0,
      stepsPerMinute: null,
      activityType: null,
      activityMinutes: loaded,
      watching: true,
      lastError: null,
    })
    watchLiveStepCount((steps) => {
      const now = Date.now()
      let stepsPerMinute: number | null = null
      let activityType: ActivityType | null = null
      if (cadenceAnchor) {
        const delta = steps - cadenceAnchor.steps
        const elapsed = now - cadenceAnchor.at
        const cadence = cadenceFromStepDelta(delta, elapsed)
        if (cadence != null) {
          stepsPerMinute = Math.round(cadence)
          activityType = classifyActivity(cadence)
          if (elapsed >= 15_000) {
            cadenceAnchor = { steps, at: now }
          }
        }
      } else {
        cadenceAnchor = { steps, at: now }
      }
      set({ liveSteps: steps, stepsPerMinute, activityType })
    })
    minutesTimer = setInterval(() => {
      const type = get().activityType
      if (!type || (get().stepsPerMinute ?? 0) < 20) return
      const next = addActivityMinute(get().activityMinutes, type, 1)
      set({ activityMinutes: next })
      void saveActivityMinutes(next)
    }, 60_000)
    void get().refreshTodaySteps()
    void get().refreshHistoricalSteps(1)
  },

  stopWatch: () => {
    stopLiveStepCount()
    clearMinutesTimer()
    cadenceAnchor = null
    set({ watching: false })
  },

  resetLive: () => {
    const { watching, startWatch, stopWatch } = get()
    if (watching) {
      stopWatch()
      void startWatch()
    } else {
      cadenceAnchor = null
      set({ liveSteps: 0, stepsPerMinute: null, activityType: null })
    }
  },
}))
