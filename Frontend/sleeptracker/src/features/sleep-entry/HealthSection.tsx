import { useFormContext } from 'react-hook-form'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SleepEntryFormValues } from '@/features/sleep-entry/sleepEntryForm.schema'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  )
}

/**
 * Health sub-form (Step 57) — weight, RHR, blood pressure (loose 120/80 regex).
 * Values live on the parent FormProvider.
 */
export function HealthSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SleepEntryFormValues>()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="health"
      className="rounded-lg border border-border"
      data-testid="health-accordion"
    >
      <AccordionItem value="health" className="border-none px-3">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          Health
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div
            className="grid gap-3 pb-2 pt-1 sm:grid-cols-3"
            data-testid="health-section-fields"
          >
            <div className="grid gap-1">
              <Label
                htmlFor="weight"
                className="text-muted-foreground text-xs font-normal"
              >
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min={0}
                max={500}
                aria-invalid={Boolean(errors.health?.weight)}
                {...register('health.weight', { valueAsNumber: true })}
              />
              <FieldError message={errors.health?.weight?.message} />
            </div>

            <div className="grid gap-1">
              <Label
                htmlFor="restingHeartRate"
                className="text-muted-foreground text-xs font-normal"
              >
                Resting heart rate
              </Label>
              <Input
                id="restingHeartRate"
                type="number"
                min={0}
                max={250}
                aria-invalid={Boolean(errors.health?.restingHeartRate)}
                {...register('health.restingHeartRate', { valueAsNumber: true })}
              />
              <FieldError message={errors.health?.restingHeartRate?.message} />
            </div>

            <div className="grid gap-1">
              <Label
                htmlFor="bloodPressure"
                className="text-muted-foreground text-xs font-normal"
              >
                Blood pressure
              </Label>
              <Input
                id="bloodPressure"
                placeholder="120/80"
                aria-invalid={Boolean(errors.health?.bloodPressure)}
                {...register('health.bloodPressure')}
              />
              <FieldError message={errors.health?.bloodPressure?.message} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
