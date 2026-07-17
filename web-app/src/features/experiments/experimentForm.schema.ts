import { z } from 'zod'

export const experimentFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after start date',
      })
    }
  })

export type ExperimentFormValues = z.infer<typeof experimentFormSchema>

export function experimentFormDefaults(): ExperimentFormValues {
  const today = new Date()
  const ymd = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  return {
    name: '',
    startDate: ymd,
    endDate: '',
  }
}
