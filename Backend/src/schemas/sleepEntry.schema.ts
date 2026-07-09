import { z } from 'zod'

const optionalDate = z.coerce.date().optional().nullable()

const score1to10 = z.number().int().min(1).max(10)

const moodSchema = z.object({
  mood: score1to10,
  stress: score1to10,
  anxiety: score1to10,
  motivation: score1to10,
})

const foodSchema = z.object({
  mealBeforeSleep: z.boolean(),
  mealTime: optionalDate,
  mealType: z.string().optional().nullable(),
  caffeineAmountMg: z.number().int().min(0).optional().nullable(),
  caffeineLastConsumed: optionalDate,
})

const exerciseSchema = z.object({
  exercise: z.boolean(),
  exerciseType: z.string().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  workoutTime: optionalDate,
})

const environmentSchema = z.object({
  roomTemp: z.number().optional().nullable(),
  fanOn: z.boolean().optional().nullable(),
  acOn: z.boolean().optional().nullable(),
  blackoutCurtains: z.boolean().optional().nullable(),
  eyeMask: z.boolean().optional().nullable(),
  whiteNoise: z.boolean().optional().nullable(),
  phoneUsedBeforeSleep: z.boolean().optional().nullable(),
  minutesPhoneBeforeSleep: z.number().int().min(0).optional().nullable(),
  sunlightSeenBeforeSleep: z.boolean().optional().nullable(),
  birdsHeard: z.boolean().optional().nullable(),
  fajrHeard: z.boolean().optional().nullable(),
  screenBrightness: z.number().int().min(0).max(100).optional().nullable(),
})

const healthSchema = z.object({
  weight: z.number().optional().nullable(),
  restingHeartRate: z.number().int().min(0).optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
})

export const sleepEntrySchema = z
  .object({
    bedTime: optionalDate,
    attemptSleepTime: optionalDate,
    estimatedSleepTime: optionalDate,
    wakeTime: optionalDate,
    outOfBedTime: optionalDate,
    numberOfAwakenings: z.number().int().min(0).optional().nullable(),
    sleepQuality: score1to10.optional().nullable(),
    energyMorning: score1to10.optional().nullable(),
    energyWork: score1to10.optional().nullable(),
    notes: z.string().optional().nullable(),
    mood: moodSchema.optional().nullable(),
    food: foodSchema.optional().nullable(),
    exercise: exerciseSchema.optional().nullable(),
    environment: environmentSchema.optional().nullable(),
    health: healthSchema.optional().nullable(),
  })
  .strict()

export type SleepEntrySchemaInput = z.infer<typeof sleepEntrySchema>
