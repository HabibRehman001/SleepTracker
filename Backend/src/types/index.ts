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
    caffeineAmountMg: number | null
  } | null
  exercise: {
    exercise: boolean
    duration: number | null
  } | null
  environment: {
    phoneUsedBeforeSleep: boolean | null
    minutesPhoneBeforeSleep: number | null
    roomTemp: number | null
  } | null
  health: {
    weight: number | null
    restingHeartRate: number | null
  } | null
}

export type CorrelationResult = {
  factor: string
  coefficient: number
  sampleSize: number
}

export type AnalyticsSummary = {
  entryCount: number
  averageSleepQuality: number | null
  correlations: CorrelationResult[]
}

export type ExperimentRecord = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  createdAt: Date
}
