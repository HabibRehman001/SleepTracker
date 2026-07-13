import { SleepEntryForm } from '@/features/sleep-entry/SleepEntryForm'

/** Back-compat alias — Log Today form lives in SleepEntryForm (Step 51). */
export function SleepLogForm() {
  return (
    <div
      className="rounded-lg border border-border p-4"
      data-testid="sleep-log-form"
    >
      <SleepEntryForm />
    </div>
  )
}
