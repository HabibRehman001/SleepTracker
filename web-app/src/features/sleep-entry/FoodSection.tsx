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
 * Food sub-form (Step 54) — Switch toggles visibility of meal detail fields.
 * Fields stay registered on the parent form (shouldUnregister: false), so
 * toggling off only hides UI — last mealTime/type/caffeine values are preserved.
 */
export function FoodSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SleepEntryFormValues>()

  const mealBeforeSleep = useWatch({
    control,
    name: 'food.mealBeforeSleep',
  })

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="food"
      className="rounded-lg border border-border"
      data-testid="food-accordion"
    >
      <AccordionItem value="food" className="border-none px-3">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          Food
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div className="grid gap-4 pb-2 pt-1" data-testid="food-section-fields">
            <Controller
              name="food.mealBeforeSleep"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="mealBeforeSleep"
                    className="text-sm font-normal"
                  >
                    Ate before sleep?
                  </Label>
                  <Switch
                    id="mealBeforeSleep"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="meal-before-sleep-switch"
                  />
                </div>
              )}
            />

            {/* Conditional render — when false, fields unmount but parent RHF keeps values */}
            {mealBeforeSleep ? (
              <div
                className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2"
                data-testid="food-detail-fields"
              >
                <div className="grid gap-1">
                  <Label
                    htmlFor="mealTime"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Meal time
                  </Label>
                  <Input
                    id="mealTime"
                    type="time"
                    aria-invalid={Boolean(errors.food?.mealTime)}
                    {...register('food.mealTime')}
                  />
                  <FieldError message={errors.food?.mealTime?.message} />
                </div>
                <div className="grid gap-1">
                  <Label
                    htmlFor="mealType"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Meal type
                  </Label>
                  <Input
                    id="mealType"
                    placeholder="e.g. light snack"
                    aria-invalid={Boolean(errors.food?.mealType)}
                    {...register('food.mealType')}
                  />
                  <FieldError message={errors.food?.mealType?.message} />
                </div>
                <div className="grid gap-1">
                  <Label
                    htmlFor="caffeineAmountMg"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Caffeine (mg)
                  </Label>
                  <Input
                    id="caffeineAmountMg"
                    type="number"
                    min={0}
                    max={1000}
                    aria-invalid={Boolean(errors.food?.caffeineAmountMg)}
                    {...register('food.caffeineAmountMg', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.food?.caffeineAmountMg?.message} />
                </div>
                <div className="grid gap-1">
                  <Label
                    htmlFor="caffeineLastConsumed"
                    className="text-muted-foreground text-xs font-normal"
                  >
                    Last caffeine
                  </Label>
                  <Input
                    id="caffeineLastConsumed"
                    type="time"
                    aria-invalid={Boolean(errors.food?.caffeineLastConsumed)}
                    {...register('food.caffeineLastConsumed')}
                  />
                  <FieldError
                    message={errors.food?.caffeineLastConsumed?.message}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
