export type MoodInput = {
  mood: number
  stress: number
  anxiety: number
  motivation: number
}

export type FoodInput = {
  mealBeforeSleep: boolean
  mealTime?: Date | null
  mealType?: string | null
  caffeineAmountMg?: number | null
  caffeineLastConsumed?: Date | null
}

export type ExerciseInput = {
  exercise: boolean
  exerciseType?: string | null
  duration?: number | null
  workoutTime?: Date | null
}

export type EnvironmentInput = {
  roomTemp?: number | null
  fanOn?: boolean | null
  acOn?: boolean | null
  blackoutCurtains?: boolean | null
  eyeMask?: boolean | null
  whiteNoise?: boolean | null
  phoneUsedBeforeSleep?: boolean | null
  minutesPhoneBeforeSleep?: number | null
  sunlightSeenBeforeSleep?: boolean | null
  birdsHeard?: boolean | null
  fajrHeard?: boolean | null
  screenBrightness?: number | null
}

export type HealthInput = {
  weight?: number | null
  restingHeartRate?: number | null
  bloodPressure?: string | null
}

export type SleepEntryInput = {
  bedTime?: Date | null
  attemptSleepTime?: Date | null
  estimatedSleepTime?: Date | null
  wakeTime?: Date | null
  outOfBedTime?: Date | null
  numberOfAwakenings?: number | null
  sleepQuality?: number | null
  energyMorning?: number | null
  energyWork?: number | null
  notes?: string | null
  mood?: MoodInput | null
  food?: FoodInput | null
  exercise?: ExerciseInput | null
  environment?: EnvironmentInput | null
  health?: HealthInput | null
}

export type SleepEntryWithRelations = {
  id: string
  date: Date
  bedTime: Date | null
  attemptSleepTime: Date | null
  estimatedSleepTime: Date | null
  wakeTime: Date | null
  outOfBedTime: Date | null
  numberOfAwakenings: number | null
  sleepQuality: number | null
  energyMorning: number | null
  energyWork: number | null
  notes: string | null
  mood: {
    mood: number
    stress: number
    anxiety: number
    motivation: number
  } | null
  food: {
    mealBeforeSleep: boolean
    mealTime?: Date | null
    mealType?: string | null
    caffeineAmountMg: number | null
    caffeineLastConsumed?: Date | null
  } | null
  exercise: {
    exercise: boolean
    exerciseType?: string | null
    duration: number | null
    workoutTime?: Date | null
  } | null
  environment: {
    roomTemp: number | null
    fanOn?: boolean | null
    acOn?: boolean | null
    blackoutCurtains?: boolean | null
    eyeMask?: boolean | null
    whiteNoise?: boolean | null
    phoneUsedBeforeSleep: boolean | null
    minutesPhoneBeforeSleep: number | null
    sunlightSeenBeforeSleep?: boolean | null
    birdsHeard?: boolean | null
    fajrHeard?: boolean | null
    screenBrightness?: number | null
  } | null
  health: {
    weight: number | null
    restingHeartRate: number | null
    bloodPressure?: string | null
  } | null
}

export type CorrelationResult = {
  factor: string
  coefficient: number
  sampleSize: number
}

/** Group comparison for a single factor × outcome (Step 71). */
export type FactorGroupStats = {
  label: string
  /** Mean of the selected outcome for this group. */
  avg: number | null
  n: number
}

export type FactorCorrelation = {
  factor: string
  /** latency | quality | duration */
  outcome: string
  /** Display title, e.g. "Phone before sleep vs latency". */
  label: string
  groupA: FactorGroupStats
  groupB: FactorGroupStats
}

/** One night on a scatter plot (Step 86). */
export type ScatterPoint = {
  x: number
  y: number
  date: string
}

/** Ordinary least-squares fit y = slope·x + intercept. */
export type LinearRegression = {
  slope: number
  intercept: number
  n: number
}

/** Raw points + trend for one factor×outcome scatter (Step 86). */
export type ScatterCorrelation = {
  key: string
  label: string
  xLabel: string
  yLabel: string
  points: ScatterPoint[]
  regression: LinearRegression | null
}

export type AnalyticsSummary = {
  entryCount: number
  averageSleepQuality: number | null
  correlations: CorrelationResult[]
}

/** Rolling window + schedule stats for dashboard (Step 34). */
export type StatsSummary = {
  todaySleep: number | null // hours slept on most recent entry night
  sleepDebt: number // minutes short of 8h target over last 7 nights (deficit only, never negative)
  avg7day: number | null // avg sleep hours over last 7 entries
  avg30day: number | null // avg sleep hours over last 30 entries
  consistencyScore: number // 0-100 from bedtime stdev (100 - min(100, stdev))
  avgBedtime: string | null // HH:mm (24h, circular mean)
  avgWakeTime: string | null // HH:mm
  avgLatency: number | null // minutes from attemptSleep → estimatedSleep
}

export type ExperimentRecord = {
  id: string
  name: string
  startDate: Date
  /** Null when the experiment is ongoing / open-ended. */
  endDate: Date | null
  createdAt: Date
}
