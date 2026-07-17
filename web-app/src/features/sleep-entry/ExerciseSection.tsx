import { Controller, useFormContext, useWatch } from 'react-hook-form'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
 * Exercise sub-form (Step 55) — Switch toggles type/duration/time fields.
 * Toggling off hides UI only; parent RHF keeps last values (shouldUnregister: false).
 */
export function ExerciseSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SleepEntryFormValues>()

  const exercised = useWatch({
    control,
    name: 'exercise.exercise',
  })

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="exercise"
      className="rounded-lg border border-border"
      data-testid="exercise-accordion"
    >
      <AccordionItem value="exercise" className="border-none px-3">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          Exercise
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div className="grid gap-4 pb-2 pt-1" data-testid="exercise-section-fields">
            <Controller
              name="exercise.exercise"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="exercisedToday" className="text-sm font-normal">
                    Exercised today?
                  </Label>
                  <Switch
                    id="exercisedToday"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="exercised-today-switch"
                  />
                </div>
              )}
            />

            {exercised ? (
              <div
                className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2"
                data-testid="exercise-detail-fields"
              >
                <div className="grid gap-1">
                  <Label
                    htmlFor="exerciseType"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Type
                  </Label>
                  <Input
                    id="exerciseType"
                    placeholder="e.g. walk, gym, yoga"
                    aria-invalid={Boolean(errors.exercise?.exerciseType)}
                    {...register('exercise.exerciseType')}
                  />
                  <FieldError message={errors.exercise?.exerciseType?.message} />
                </div>
                <div className="grid gap-1">
                  <Label
                    htmlFor="exerciseDuration"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Duration (min)
                  </Label>
                  <Input
                    id="exerciseDuration"
                    type="number"
                    min={0}
                    max={600}
                    aria-invalid={Boolean(errors.exercise?.duration)}
                    {...register('exercise.duration', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.exercise?.duration?.message} />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label
                    htmlFor="workoutTime"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Workout time
                  </Label>
                  <Input
                    id="workoutTime"
                    type="time"
                    className="max-w-xs"
                    aria-invalid={Boolean(errors.exercise?.workoutTime)}
                    {...register('exercise.workoutTime')}
                  />
                  <FieldError message={errors.exercise?.workoutTime?.message} />
                </div>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
