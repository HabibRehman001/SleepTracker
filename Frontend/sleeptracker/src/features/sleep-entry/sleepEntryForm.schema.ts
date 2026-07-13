import { z } from 'zod'

const timeString = z
  .string()
  .min(1, 'Required')
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')

const optionalTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
  .or(z.literal(''))

export const score1to10 = z
  .number({ error: 'Must be a number' })
  .int()
  .min(1, 'Must be at least 1')
  .max(10, 'Must be at most 10')

const moodSchema = z.object({
  mood: score1to10,
  stress: score1to10,
  anxiety: score1to10,
  motivation: score1to10,
})

/**
 * Food sub-form — meal detail fields stay in parent RHF even when
 * mealBeforeSleep is toggled off (conditional UI only; values preserved).
 */
const foodSchema = z.object({
  mealBeforeSleep: z.boolean(),
  mealTime: optionalTime,
  mealType: z.string().max(100),
  caffeineAmountMg: z.number().int().min(0).max(1000),
  caffeineLastConsumed: optionalTime,
})

/** Exercise — detail fields preserved when "Exercised today?" is toggled off. */
const exerciseSchema = z.object({
  exercise: z.boolean(),
  exerciseType: z.string().max(100),
  duration: z.number().int().min(0).max(600),
  workoutTime: optionalTime,
})

/** Environment — room toggles + temp + brightness (all on parent form). */
const environmentSchema = z.object({
  fanOn: z.boolean(),
  acOn: z.boolean(),
  blackoutCurtains: z.boolean(),
  eyeMask: z.boolean(),
  whiteNoise: z.boolean(),
  sunlightSeenBeforeSleep: z.boolean(),
  birdsHeard: z.boolean(),
  fajrHeard: z.boolean(),
  roomTemp: z.number().min(-10).max(50),
  screenBrightness: z.number().int().min(0).max(100),
})

/**
 * Health — BP is free text; loose systolic/diastolic pattern (e.g. 120/80).
 * Empty string allowed for skipped BP entry.
 */
const bloodPressureLoose = z
  .string()
  .refine(
    (v) => v === '' || /^\d{2,3}\s*\/\s*\d{2,3}$/.test(v.trim()),
    { message: 'Use format like 120/80' }
  )

const healthSchema = z.object({
  weight: z.number().min(0).max(500),
  restingHeartRate: z.number().int().min(0).max(250),
  bloodPressure: bloodPressureLoose,
})

/**
 * Frontend SleepEntry form schema.
 * Times are HH:MM from <input type="time"> — combined with selectedDate on submit.
 * Sub-sections live on the parent form so collapse/toggle never resets values.
 */
export const sleepEntryFormSchema = z.object({
  bedTime: timeString,
  attemptSleepTime: timeString,
  estimatedSleepTime: timeString,
  wakeTime: timeString,
  outOfBedTime: timeString.optional().or(z.literal('')),
  sleepQuality: score1to10,
  energyMorning: score1to10,
  energyWork: score1to10,
  numberOfAwakenings: z.number().int().min(0).max(30),
  notes: z.string().max(2000).optional(),
  mood: moodSchema,
  food: foodSchema,
  exercise: exerciseSchema,
  environment: environmentSchema,
  health: healthSchema,
})

export type SleepEntryFormValues = z.infer<typeof sleepEntryFormSchema>

export const sleepEntryFormDefaults: SleepEntryFormValues = {
  bedTime: '23:00',
  attemptSleepTime: '23:15',
  estimatedSleepTime: '23:30',
  wakeTime: '07:00',
  outOfBedTime: '07:15',
  sleepQuality: 7,
  energyMorning: 6,
  energyWork: 6,
  numberOfAwakenings: 0,
  notes: '',
  mood: {
    mood: 5,
    stress: 5,
    anxiety: 5,
    motivation: 5,
  },
  food: {
    mealBeforeSleep: false,
    mealTime: '21:00',
    mealType: 'light snack',
    caffeineAmountMg: 0,
    caffeineLastConsumed: '',
  },
  exercise: {
    exercise: false,
    exerciseType: 'walk',
    duration: 30,
    workoutTime: '18:00',
  },
  environment: {
    fanOn: false,
    acOn: false,
    blackoutCurtains: true,
    eyeMask: false,
    whiteNoise: false,
    sunlightSeenBeforeSleep: false,
    birdsHeard: false,
    fajrHeard: false,
    roomTemp: 24,
    screenBrightness: 40,
  },
  health: {
    weight: 0,
    restingHeartRate: 0,
    bloodPressure: '',
  },
}
