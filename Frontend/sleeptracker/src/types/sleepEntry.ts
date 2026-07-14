/**
 * Frontend mirrors of Backend/prisma/schema.prisma models.
 * Datetimes are ISO strings — JSON wire format from Express/Prisma.
 * Hand-written for Step 44 (auto-sync via prisma-zod-generator is optional later).
 */

export type MoodEntry = {
  id: string
  sleepEntryId: string
  mood: number
  stress: number
  anxiety: number
  motivation: number
}

export type FoodEntry = {
  id: string
  sleepEntryId: string
  mealBeforeSleep: boolean
  mealTime: string | null
  mealType: string | null
  caffeineAmountMg: number | null
  caffeineLastConsumed: string | null
}

export type ExerciseEntry = {
  id: string
  sleepEntryId: string
  exercise: boolean
  exerciseType: string | null
  duration: number | null
  workoutTime: string | null
}

export type EnvironmentEntry = {
  id: string
  sleepEntryId: string
  roomTemp: number | null
  fanOn: boolean | null
  acOn: boolean | null
  blackoutCurtains: boolean | null
  eyeMask: boolean | null
  whiteNoise: boolean | null
  phoneUsedBeforeSleep: boolean | null
  minutesPhoneBeforeSleep: number | null
  sunlightSeenBeforeSleep: boolean | null
  birdsHeard: boolean | null
  fajrHeard: boolean | null
  screenBrightness: number | null
}

export type HealthEntry = {
  id: string
  sleepEntryId: string
  weight: number | null
  restingHeartRate: number | null
  bloodPressure: string | null
}

/** SleepEntry hub + optional 1:1 children (GET /sleep-entries shape). */
export type SleepEntry = {
  id: string
  date: string
  bedTime: string | null
  attemptSleepTime: string | null
  estimatedSleepTime: string | null
  wakeTime: string | null
  outOfBedTime: string | null
  numberOfAwakenings: number | null
  sleepQuality: number | null
  energyMorning: number | null
  energyWork: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  mood: MoodEntry | null
  food: FoodEntry | null
  exercise: ExerciseEntry | null
  environment: EnvironmentEntry | null
  health: HealthEntry | null
}

/** PUT /sleep-entries/:date body — dates as ISO strings or omit. */
export type SleepEntryWrite = {
  bedTime?: string | null
  attemptSleepTime?: string | null
  estimatedSleepTime?: string | null
  wakeTime?: string | null
  outOfBedTime?: string | null
  numberOfAwakenings?: number | null
  sleepQuality?: number | null
  energyMorning?: number | null
  energyWork?: number | null
  notes?: string | null
  mood?: Omit<MoodEntry, 'id' | 'sleepEntryId'> | null
  food?: Omit<FoodEntry, 'id' | 'sleepEntryId'> | null
  exercise?: Omit<ExerciseEntry, 'id' | 'sleepEntryId'> | null
  environment?: Omit<EnvironmentEntry, 'id' | 'sleepEntryId'> | null
  health?: Omit<HealthEntry, 'id' | 'sleepEntryId'> | null
}

export type Experiment = {
  id: string
  name: string
  startDate: string
  /** Null / omitted when ongoing (open-ended). */
  endDate: string | null
  createdAt: string
}
