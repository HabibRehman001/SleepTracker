import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  experimentFormDefaults,
  experimentFormSchema,
  type ExperimentFormValues,
} from '@/features/experiments/experimentForm.schema'
import { useCreateExperiment } from '@/features/experiments/useExperiments'

/**
 * Step 97 — create experiment: name + start date + optional end date.
 */
export function ExperimentForm() {
  const create = useCreateExperiment()
  const form = useForm<ExperimentFormValues>({
    resolver: zodResolver(experimentFormSchema),
    defaultValues: experimentFormDefaults(),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate?.trim() ? values.endDate : null,
      })
      toast.success('Experiment created')
      form.reset(experimentFormDefaults())
    } catch {
      toast.error('Could not create experiment')
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-md border border-border/80 bg-card/40 p-4"
      data-testid="experiment-form"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="experiment-name">Name</Label>
        <Input
          id="experiment-name"
          placeholder="e.g. No phone after 9pm"
          {...form.register('name')}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
        {form.formState.errors.name ? (
          <p className="text-destructive text-xs">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="experiment-start">Start date</Label>
          <Input
            id="experiment-start"
            type="date"
            {...form.register('startDate')}
            aria-invalid={Boolean(form.formState.errors.startDate)}
          />
          {form.formState.errors.startDate ? (
            <p className="text-destructive text-xs">
              {form.formState.errors.startDate.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experiment-end">
            End date{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="experiment-end"
            type="date"
            {...form.register('endDate')}
            aria-invalid={Boolean(form.formState.errors.endDate)}
          />
          {form.formState.errors.endDate ? (
            <p className="text-destructive text-xs">
              {form.formState.errors.endDate.message}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Leave blank for an ongoing experiment.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Saving…' : 'Create experiment'}
      </Button>
    </form>
  )
}

// Keep React in scope for SSR/tsx classic JSX transform.
void React
