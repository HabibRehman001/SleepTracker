import { z } from 'zod'

const timeString = z
  .string()
  .min(1, 'Required')
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')

/** 3-field Quick Log — bed / wake / quality only (Step 58). */
export const quickLogSchema = z.object({
  bedTime: timeString,
  wakeTime: timeString,
  sleepQuality: z
    .number({ error: 'Must be a number' })
    .int()
    .min(1, 'Must be at least 1')
    .max(10, 'Must be at most 10'),
})

export type QuickLogValues = z.infer<typeof quickLogSchema>

export const quickLogDefaults: QuickLogValues = {
  bedTime: '23:00',
  wakeTime: '07:00',
  sleepQuality: 7,
}
