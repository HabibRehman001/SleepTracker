import { DateSelector } from '@/features/sleep-entry/DateSelector'
import { SleepLogForm } from '@/features/sleep-entry/SleepLogForm'

/** /log — DateSelector + SleepLogForm share Zustand selectedDate. */
export function LogEntryPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Log Entry</h1>
        <p className="text-muted-foreground text-sm">
          Pick a date — the form below updates instantly via the UI store.
        </p>
      </div>
      <DateSelector />
      <SleepLogForm />
    </div>
  )
}
