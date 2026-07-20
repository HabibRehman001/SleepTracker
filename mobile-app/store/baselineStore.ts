import { create } from 'zustand'

import {
  averageBedWakeFromWindows,
  BASELINE_TARGET_NIGHTS,
  deserializeWindow,
  serializeWindow,
  type DetectedSleepWindow,
} from '../services/baselineDetection'
import {
  evaluateNightDetection,
  FAILED_DETECTION_PROMPT,
  manualNightToWindow,
} from '../services/nightDetection'
import type { Sample } from '../services/staticWindow'
import type { MotionSample } from '../services/motionSampleMath'

/**
 * Auto-detected stats (Steps 123 / 145 / 146).
 * Failed nights prompt manual entry — they never invent a wrong window.
 */
export type PersistedSleepWindow = {
  startIso: string
  endIso: string
}

export type BaselineStats = {
  avgDailySteps: number | null
  detectedBedtime: string | null
  detectedWaketime: string | null
  sampleNights: number
  detectedAt: string | null
  detectedWindows: PersistedSleepWindow[]
  baselineReady: boolean
  /** Step 146 — show morning manual-entry prompt. */
  pendingManualEntry: boolean
  /** ISO date (YYYY-MM-DD) of the failed night’s morning, if any. */
  failedNightKey: string | null
  lastDetectionPrompt: string | null
  /** Step 147 — user has locked in (or dismissed) the results screen. */
  baselineResultsSeen: boolean
}

type BaselineState = BaselineStats & {
  setBaseline: (partial: Partial<BaselineStats>) => void
  resetBaseline: () => void
  addDetectedWindow: (window: DetectedSleepWindow) => void
  setDetectedWindows: (windows: DetectedSleepWindow[]) => void
  /** Run detection for one night’s samples; failed → prompt, no baseline write. */
  processNightSamples: (samples: Array<Sample | MotionSample>) => 'ok' | 'failed'
  dismissManualEntry: () => void
  /** Manual two-time fallback after a failed night. */
  submitManualNight: (bedtimeHHMM: string, waketimeHHMM: string) => void
  markBaselineResultsSeen: () => void
}

const emptyBaseline: BaselineStats = {
  avgDailySteps: null,
  detectedBedtime: null,
  detectedWaketime: null,
  sampleNights: 0,
  detectedAt: null,
  detectedWindows: [],
  baselineReady: false,
  pendingManualEntry: false,
  failedNightKey: null,
  lastDetectionPrompt: null,
  baselineResultsSeen: false,
}

function morningKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function applyWindows(
  windows: DetectedSleepWindow[],
  prev: BaselineStats
): Partial<BaselineStats> {
  const persisted = windows.map(serializeWindow)
  const avg = averageBedWakeFromWindows(windows)
  if (!avg) {
    return {
      detectedWindows: persisted,
      sampleNights: windows.length,
      baselineReady: false,
      detectedBedtime: prev.detectedBedtime,
      detectedWaketime: prev.detectedWaketime,
    }
  }
  return {
    detectedWindows: persisted,
    sampleNights: avg.sampleNights,
    detectedBedtime: avg.detectedBedtime,
    detectedWaketime: avg.detectedWaketime,
    baselineReady: windows.length >= BASELINE_TARGET_NIGHTS,
    detectedAt: new Date().toISOString(),
  }
}

export const useBaselineStore = create<BaselineState>((set, get) => ({
  ...emptyBaseline,
  setBaseline: (partial) =>
    set((state) => ({
      ...state,
      ...partial,
      detectedAt: partial.detectedAt ?? new Date().toISOString(),
    })),
  resetBaseline: () => set({ ...emptyBaseline }),

  addDetectedWindow: (window) => {
    const existing = get().detectedWindows.map(deserializeWindow)
    const next = [...existing, window].slice(0, BASELINE_TARGET_NIGHTS)
    set((state) => ({
      ...state,
      ...applyWindows(next, state),
      pendingManualEntry: false,
      failedNightKey: null,
      lastDetectionPrompt: null,
    }))
  },

  setDetectedWindows: (windows) => {
    const next = windows.slice(0, BASELINE_TARGET_NIGHTS)
    set((state) => ({
      ...state,
      ...applyWindows(next, state),
    }))
  },

  processNightSamples: (samples) => {
    const result = evaluateNightDetection(samples)
    if (result.status === 'ok') {
      get().addDetectedWindow(result.window)
      return 'ok'
    }
    // Failed — do NOT add a guessed window to baseline.
    set({
      pendingManualEntry: true,
      failedNightKey: morningKey(),
      lastDetectionPrompt: FAILED_DETECTION_PROMPT,
    })
    return 'failed'
  },

  dismissManualEntry: () =>
    set({
      pendingManualEntry: false,
      lastDetectionPrompt: null,
    }),

  submitManualNight: (bedtimeHHMM, waketimeHHMM) => {
    const window = manualNightToWindow(bedtimeHHMM, waketimeHHMM)
    get().addDetectedWindow(window)
  },

  markBaselineResultsSeen: () => set({ baselineResultsSeen: true }),
}))

export { BASELINE_TARGET_NIGHTS, FAILED_DETECTION_PROMPT }
