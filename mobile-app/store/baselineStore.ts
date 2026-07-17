import { create } from 'zustand'

/**
 * Auto-detected stats gathered during onboarding (Step 123).
 * Populated by sensors / heuristics later — store shape is locked now.
 */
export type BaselineStats = {
  /** Average daily steps observed in onboarding window */
  avgDailySteps: number | null
  /** Typical bedtime HH:MM inferred before user confirms */
  detectedBedtime: string | null
  /** Typical wake HH:MM inferred before user confirms */
  detectedWaketime: string | null
  /** Sample nights used for detection */
  sampleNights: number
  /** ISO timestamp when baseline was last computed */
  detectedAt: string | null
}

type BaselineState = BaselineStats & {
  setBaseline: (partial: Partial<BaselineStats>) => void
  resetBaseline: () => void
}

const emptyBaseline: BaselineStats = {
  avgDailySteps: null,
  detectedBedtime: null,
  detectedWaketime: null,
  sampleNights: 0,
  detectedAt: null,
}

export const useBaselineStore = create<BaselineState>((set) => ({
  ...emptyBaseline,
  setBaseline: (partial) =>
    set((state) => ({
      ...state,
      ...partial,
      detectedAt: partial.detectedAt ?? new Date().toISOString(),
    })),
  resetBaseline: () => set({ ...emptyBaseline }),
}))
