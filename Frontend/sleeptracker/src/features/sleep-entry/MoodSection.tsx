import { Controller, useFormContext } from 'react-hook-form'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SleepEntryFormValues } from '@/features/sleep-entry/sleepEntryForm.schema'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  )
}

function MoodScoreSlider({
  name,
  label,
}: {
  name: `mood.${'mood' | 'stress' | 'anxiety' | 'motivation'}`
  label: string
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<SleepEntryFormValues>()

  const fieldError =
    name === 'mood.mood'
      ? errors.mood?.mood?.message
      : name === 'mood.stress'
        ? errors.mood?.stress?.message
        : name === 'mood.anxiety'
          ? errors.mood?.anxiety?.message
          : errors.mood?.motivation?.message

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs font-normal">
              {label}
            </Label>
            <span
              className="font-mono text-sm tabular-nums"
              data-testid={`${name}-value`}
            >
              {field.value}
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[field.value]}
            onValueChange={(v) => field.onChange(v[0] ?? 1)}
            aria-label={label}
            aria-invalid={Boolean(fieldError)}
          />
          <FieldError message={fieldError} />
        </div>
      )}
    />
  )
}

/**
 * Mood sub-form (Step 53) — Accordion on the same /log page.
 * Controllers bind to parent FormProvider; collapse must not reset values
 * (RHF shouldUnregister: false keeps mood.* in parent form state).
 */
export function MoodSection() {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="mood"
      className="rounded-lg border border-border"
      data-testid="mood-accordion"
    >
      <AccordionItem value="mood" className="border-none px-3">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          Mood
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div className="grid gap-4 pb-2 pt-1" data-testid="mood-section-fields">
            <p className="text-muted-foreground text-xs">
              Optional factors for correlations — stays filled when you collapse
              this section.
            </p>
            <MoodScoreSlider name="mood.mood" label="Mood" />
            <MoodScoreSlider name="mood.stress" label="Stress" />
            <MoodScoreSlider name="mood.anxiety" label="Anxiety" />
            <MoodScoreSlider name="mood.motivation" label="Motivation" />
          </div>
        </AccordionContent>      </AccordionItem>
    </Accordion>
  )
}
