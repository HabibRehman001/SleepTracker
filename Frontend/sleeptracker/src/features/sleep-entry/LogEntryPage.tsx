import { DateSelector } from '@/features/sleep-entry/DateSelector'
import { QuickLogActions } from '@/features/sleep-entry/QuickLogActions'
import { SleepEntryForm } from '@/features/sleep-entry/SleepEntryForm'

/** /log — Quick Log CTA + date chips + Full Log form. */
export function LogEntryPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Log Today</h1>
          <p className="text-muted-foreground text-sm">
            Busy? Quick Log bed / wake / quality in ~10 seconds. Or fill the full
            form below.
          </p>
        </div>
        <QuickLogActions fullLogHref="#full-log" />
      </div>
      <DateSelector />
      <div
        id="full-log"
        className="scroll-mt-16 rounded-lg border border-border p-4"
      >
        <SleepEntryForm />
      </div>
    </div>
  )
}
