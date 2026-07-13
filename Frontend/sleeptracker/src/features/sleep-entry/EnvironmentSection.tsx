import { Controller, useFormContext } from 'react-hook-form'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { SleepEntryFormValues } from '@/features/sleep-entry/sleepEntryForm.schema'

type EnvToggleKey =
  | 'fanOn'
  | 'acOn'
  | 'blackoutCurtains'
  | 'eyeMask'
  | 'whiteNoise'
  | 'sunlightSeenBeforeSleep'
  | 'birdsHeard'
  | 'fajrHeard'

const ENV_TOGGLES: { name: EnvToggleKey; label: string }[] = [
  { name: 'fanOn', label: 'Fan' },
  { name: 'acOn', label: 'AC' },
  { name: 'blackoutCurtains', label: 'Blackout curtains' },
  { name: 'eyeMask', label: 'Eye mask' },
  { name: 'whiteNoise', label: 'White noise' },
  { name: 'sunlightSeenBeforeSleep', label: 'Saw sunlight / sunrise' },
  { name: 'birdsHeard', label: 'Heard birds' },
  { name: 'fajrHeard', label: 'Heard Fajr' },
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  )
}

function EnvToggle({ name, label }: { name: EnvToggleKey; label: string }) {
  const { control } = useFormContext<SleepEntryFormValues>()
  const fieldName = `environment.${name}` as const

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-2">
          <Label
            htmlFor={fieldName}
            className="text-xs font-normal leading-snug"
          >
            {label}
          </Label>
          <Switch
            id={fieldName}
            size="sm"
            checked={field.value}
            onCheckedChange={field.onChange}
            data-testid={fieldName}
          />
        </div>
      )}
    />
  )
}

/**
 * Environment sub-form (Step 56) — toggle grid + room temp + brightness slider.
 * Values live on the parent FormProvider (accordion collapse does not reset them).
 */
export function EnvironmentSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SleepEntryFormValues>()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="environment"
      className="rounded-lg border border-border"
      data-testid="environment-accordion"
    >
      <AccordionItem value="environment" className="border-none px-3">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          Environment
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div
            className="grid gap-4 pb-2 pt-1"
            data-testid="environment-section-fields"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {ENV_TOGGLES.map((item) => (
                <EnvToggle key={item.name} {...item} />
              ))}
            </div>

            <div className="grid gap-4 border-t border-border pt-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label
                  htmlFor="roomTemp"
                  className="text-muted-foreground text-xs font-normal"
                >
                  Room temperature (°C)
                </Label>
                <Input
                  id="roomTemp"
                  type="number"
                  step="0.5"
                  min={-10}
                  max={50}
                  aria-invalid={Boolean(errors.environment?.roomTemp)}
                  {...register('environment.roomTemp', { valueAsNumber: true })}
                />
                <FieldError message={errors.environment?.roomTemp?.message} />
              </div>

              <Controller
                name="environment.screenBrightness"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs font-normal">
                        Screen brightness
                      </Label>
                      <span
                        className="font-mono text-sm tabular-nums"
                        data-testid="environment.screenBrightness-value"
                      >
                        {field.value}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0] ?? 0)}
                      aria-label="Screen brightness"
                    />
                    <FieldError
                      message={errors.environment?.screenBrightness?.message}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
