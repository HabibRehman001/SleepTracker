import { useUiStore } from '@/stores/ui-store'

/**
 * Stub log form — reads selectedDate from Zustand.
 * Changing DateSelector on the same page updates this instantly (no props drilled).
 * Server entry payload will load via TanStack Query in a later step.
 */
export function SleepLogForm() {
  const selectedDate = useUiStore((s) => s.selectedDate)

  return (
    <div
      className="space-y-3 rounded-lg border border-border p-4"
      data-testid="sleep-log-form"
    >
      <div>
        <h2 className="text-base font-medium tracking-tight">Log sleep</h2>
        <p className="text-muted-foreground text-sm">
          Logging for{' '}
          <span className="text-foreground font-medium" data-testid="form-selected-date">
            {selectedDate}
          </span>
        </p>
      </div>
      <p className="text-muted-foreground text-xs">
        Form fields land in a later step. Date is shared UI state only — not
        duplicated from the server cache.
      </p>
    </div>
  )
}
