import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useSaveSleepEntry } from '@/features/sleep-entry/useSleepEntries'
import {
  quickLogDefaults,
  quickLogSchema,
  type QuickLogValues,
} from '@/features/sleep-entry/quickLog.schema'
import { useUiStore } from '@/stores/ui-store'

function withDay(dateYmd: string, timeHm: string, nextDay = false): string {
  const [y, m, d] = dateYmd.split('-').map(Number)
  const [hh, mm] = timeHm.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0)
  if (nextDay) dt.setDate(dt.getDate() + 1)
  return dt.toISOString()
}

/**
 * Quick Log modal (Step 58) — only bedTime, wakeTime, sleepQuality.
 * Writes a partial SleepEntry; dashboard/stats already tolerate null children.
 */
export function QuickLogDialog() {
  const open = useUiStore((s) => s.quickLogOpen)
  const setOpen = useUiStore((s) => s.setQuickLogOpen)
  const selectedDate = useUiStore((s) => s.selectedDate)
  const saveMutation = useSaveSleepEntry()

  const form = useForm<QuickLogValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: quickLogDefaults,
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form

  const onValid = (data: QuickLogValues) => {
    const wakeNextDay = data.wakeTime < data.bedTime
    saveMutation.mutate(
      {
        date: selectedDate,
        bedTime: withDay(selectedDate, data.bedTime),
        // Duration calc: estimatedSleepTime ?? attemptSleepTime ?? bedTime → wakeTime
        wakeTime: withDay(selectedDate, data.wakeTime, wakeNextDay),
        sleepQuality: data.sleepQuality,
        // Explicit partial — leave optional hubs null so dashboard averages skip them
        attemptSleepTime: null,
        estimatedSleepTime: null,
        outOfBedTime: null,
        energyMorning: null,
        energyWork: null,
        numberOfAwakenings: null,
        notes: null,
        mood: null,
        food: null,
        exercise: null,
        environment: null,
        health: null,
      },
      {
        // Toast success/error from useSaveSleepEntry (Step 110).
        onSuccess: () => {
          setOpen(false)
          reset(quickLogDefaults)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="quick-log-dialog">
        <DialogHeader>
          <DialogTitle>Quick Log</DialogTitle>
          <DialogDescription>
            Bed, wake, and quality for {selectedDate} — ~10 seconds. Add details
            later via Full Log.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={handleSubmit(onValid)}
          noValidate
          data-testid="quick-log-form"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="ql-bedTime" className="text-xs font-normal">
                Bed time
              </Label>
              <Input
                id="ql-bedTime"
                type="time"
                aria-invalid={Boolean(errors.bedTime)}
                {...register('bedTime')}
              />
              {errors.bedTime ? (
                <p className="text-destructive text-xs" role="alert">
                  {errors.bedTime.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ql-wakeTime" className="text-xs font-normal">
                Wake time
              </Label>
              <Input
                id="ql-wakeTime"
                type="time"
                aria-invalid={Boolean(errors.wakeTime)}
                {...register('wakeTime')}
              />
              {errors.wakeTime ? (
                <p className="text-destructive text-xs" role="alert">
                  {errors.wakeTime.message}
                </p>
              ) : null}
            </div>
          </div>

          <Controller
            name="sleepQuality"
            control={control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-normal">Sleep quality</Label>
                  <span className="font-mono text-sm tabular-nums">
                    {field.value}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[field.value]}
                  onValueChange={(v) => field.onChange(v[0] ?? 1)}
                  aria-label="Sleep quality"
                />
                {errors.sleepQuality ? (
                  <p className="text-destructive text-xs" role="alert">
                    {errors.sleepQuality.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save quick log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
