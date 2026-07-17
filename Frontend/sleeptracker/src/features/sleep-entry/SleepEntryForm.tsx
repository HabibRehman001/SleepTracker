import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useRef, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { MoodSection } from '@/features/sleep-entry/MoodSection'
import { FoodSection } from '@/features/sleep-entry/FoodSection'
import { ExerciseSection } from '@/features/sleep-entry/ExerciseSection'
import { EnvironmentSection } from '@/features/sleep-entry/EnvironmentSection'
import { HealthSection } from '@/features/sleep-entry/HealthSection'
import { useSaveSleepEntry } from '@/features/sleep-entry/useSleepEntries'
import {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
  type SleepEntryFormValues,
} from '@/features/sleep-entry/sleepEntryForm.schema'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'

/** Combine YYYY-MM-DD + HH:MM into ISO for the API. */
export function combineDateAndTime(dateYmd: string, timeHm: string): string {
  const [y, m, d] = dateYmd.split('-').map(Number)
  const [hh, mm] = timeHm.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString()
}

function toApiPayload(date: string, data: SleepEntryFormValues) {
  const sleepStart = data.estimatedSleepTime || data.attemptSleepTime || data.bedTime
  const wakeNeedsNextDay = Boolean(sleepStart && data.wakeTime < sleepStart)
  const outNeedsNextDay = Boolean(
    data.outOfBedTime && sleepStart && data.outOfBedTime < sleepStart
  )

  const withDay = (timeHm: string, nextDay: boolean) => {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = timeHm.split(':').map(Number)
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0)
    if (nextDay) dt.setDate(dt.getDate() + 1)
    return dt.toISOString()
  }

  return {
    date,
    bedTime: withDay(data.bedTime, false),
    attemptSleepTime: withDay(data.attemptSleepTime, false),
    estimatedSleepTime: withDay(data.estimatedSleepTime, false),
    wakeTime: withDay(data.wakeTime, wakeNeedsNextDay),
    outOfBedTime: data.outOfBedTime
      ? withDay(data.outOfBedTime, outNeedsNextDay)
      : null,
    sleepQuality: data.sleepQuality,
    energyMorning: data.energyMorning,
    energyWork: data.energyWork,
    numberOfAwakenings: data.numberOfAwakenings,
    notes: data.notes || null,
    mood: data.mood,
    food: {
      mealBeforeSleep: data.food.mealBeforeSleep,
      mealTime:
        data.food.mealBeforeSleep && data.food.mealTime
          ? withDay(data.food.mealTime, false)
          : null,
      mealType: data.food.mealBeforeSleep
        ? data.food.mealType || null
        : null,
      caffeineAmountMg: data.food.caffeineAmountMg,
      caffeineLastConsumed:
        data.food.caffeineLastConsumed
          ? withDay(data.food.caffeineLastConsumed, false)
          : null,
    },
    exercise: {
      exercise: data.exercise.exercise,
      exerciseType: data.exercise.exercise
        ? data.exercise.exerciseType || null
        : null,
      duration: data.exercise.exercise ? data.exercise.duration : null,
      workoutTime:
        data.exercise.exercise && data.exercise.workoutTime
          ? withDay(data.exercise.workoutTime, false)
          : null,
    },
    environment: {
      ...data.environment,
      phoneUsedBeforeSleep: null,
      minutesPhoneBeforeSleep: null,
    },
    health: {
      weight: data.health.weight || null,
      restingHeartRate: data.health.restingHeartRate || null,
      bloodPressure: data.health.bloodPressure.trim() || null,
    },
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-destructive text-xs" role="alert" data-testid="field-error">
      {message}
    </p>
  )
}

function TimeField({
  label,
  error,
  ...props
}: {
  label: string
  error?: string
} & ComponentProps<'input'>) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={props.id} className="text-muted-foreground text-xs font-normal">
        {label}
      </Label>
      <Input type="time" aria-invalid={Boolean(error)} {...props} />
      <FieldError message={error} />
    </div>
  )
}

function ScoreSlider({
  label,
  value,
  onChange,
  error,
  name,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  error?: string
  name: string
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-normal">{label}</Label>
        <span className="font-mono text-sm tabular-nums" data-testid={`${name}-value`}>
          {value}
        </span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 1)}
        aria-label={label}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </div>
  )
}

/**
 * Log Today form — parent RHF owns all values including Mood accordion (Step 53).
 */
export function SleepEntryForm() {
  const selectedDate = useUiStore((s) => s.selectedDate)
  const saveMutation = useSaveSleepEntry()
  const networkCalls = useRef(0)

  const form = useForm<SleepEntryFormValues>({
    resolver: zodResolver(sleepEntryFormSchema),
    defaultValues: sleepEntryFormDefaults,
    mode: 'onSubmit',
    // Keep mood.* (and all fields) when Accordion unmounts collapsed content
    shouldUnregister: false,
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form

  const onValid = (data: SleepEntryFormValues) => {
    networkCalls.current += 1
    // Success/error toasts live on useSaveSleepEntry (Step 110).
    saveMutation.mutate({ ...toApiPayload(selectedDate, data) })
  }

  const submitWithInvalidQuality = () => {
    const before = networkCalls.current
    setValue('sleepQuality', 0 as unknown as number, { shouldValidate: false })
    void handleSubmit(onValid, () => {
      if (networkCalls.current > before) {
        console.error('[SleepEntryForm] network called on invalid submit')
      }
    })()
  }

  return (
    <FormProvider {...form}>
      <form
        className="space-y-5"
        data-testid="sleep-entry-form"
        onSubmit={handleSubmit(onValid)}
        noValidate
      >
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-base font-medium tracking-tight">Log Today</h2>
            <p className="text-muted-foreground text-sm">
              Logging for{' '}
              <span
                className="text-foreground font-medium"
                data-testid="form-selected-date"
              >
                {selectedDate}
              </span>
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save entry'}
          </Button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <TimeField
            id="bedTime"
            label="Bed time"
            error={errors.bedTime?.message}
            {...register('bedTime')}
          />
          <TimeField
            id="attemptSleepTime"
            label="Attempt sleep"
            error={errors.attemptSleepTime?.message}
            {...register('attemptSleepTime')}
          />
          <TimeField
            id="estimatedSleepTime"
            label="Estimated sleep"
            error={errors.estimatedSleepTime?.message}
            {...register('estimatedSleepTime')}
          />
          <TimeField
            id="wakeTime"
            label="Wake time"
            error={errors.wakeTime?.message}
            {...register('wakeTime')}
          />
          <TimeField
            id="outOfBedTime"
            label="Out of bed"
            error={errors.outOfBedTime?.message}
            {...register('outOfBedTime')}
          />
          <div className="grid gap-1">
            <Label
              htmlFor="numberOfAwakenings"
              className="text-muted-foreground text-xs font-normal"
            >
              Awakenings
            </Label>
            <Input
              id="numberOfAwakenings"
              type="number"
              min={0}
              max={30}
              aria-invalid={Boolean(errors.numberOfAwakenings)}
              {...register('numberOfAwakenings', { valueAsNumber: true })}
            />
            <FieldError message={errors.numberOfAwakenings?.message} />
          </div>
        </section>

        <section className="grid gap-4">
          <Controller
            name="sleepQuality"
            control={control}
            render={({ field }) => (
              <ScoreSlider
                name="sleepQuality"
                label="Sleep quality"
                value={field.value}
                onChange={field.onChange}
                error={errors.sleepQuality?.message}
              />
            )}
          />
          <Controller
            name="energyMorning"
            control={control}
            render={({ field }) => (
              <ScoreSlider
                name="energyMorning"
                label="Energy (morning)"
                value={field.value}
                onChange={field.onChange}
                error={errors.energyMorning?.message}
              />
            )}
          />
          <Controller
            name="energyWork"
            control={control}
            render={({ field }) => (
              <ScoreSlider
                name="energyWork"
                label="Energy (work)"
                value={field.value}
                onChange={field.onChange}
                error={errors.energyWork?.message}
              />
            )}
          />
        </section>

        <MoodSection />
        <FoodSection />
        <ExerciseSection />
        <EnvironmentSection />
        <HealthSection />

        <div className="grid gap-1">
          <Label htmlFor="notes" className="text-muted-foreground text-xs font-normal">
            Notes
          </Label>
          <textarea
            id="notes"
            rows={3}
            className={cn(
              'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30'
            )}
            {...register('notes')}
          />
          <FieldError message={errors.notes?.message} />
        </div>

        {errors.sleepQuality ? (
          <p
            className="text-destructive text-sm"
            data-testid="sleep-quality-error"
            role="alert"
          >
            {errors.sleepQuality.message}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="force-invalid-quality"
          onClick={submitWithInvalidQuality}
        >
          Test invalid quality (0)
        </Button>
      </form>
    </FormProvider>
  )
}
