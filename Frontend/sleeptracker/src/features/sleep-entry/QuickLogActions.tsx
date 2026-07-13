import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { QuickLogDialog } from '@/features/sleep-entry/QuickLogDialog'
import { useUiStore } from '@/stores/ui-store'

/** Prominent Quick Log CTA + Full Log link (Step 58). */
export function QuickLogActions({
  fullLogHref = '/log#full-log',
}: {
  fullLogHref?: string
}) {
  const setQuickLogOpen = useUiStore((s) => s.setQuickLogOpen)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3" data-testid="quick-log-actions">
        <Button
          size="lg"
          onClick={() => setQuickLogOpen(true)}
          data-testid="quick-log-button"
        >
          Quick Log
        </Button>
        <Link
          to={fullLogHref}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          data-testid="full-log-link"
        >
          Full Log
        </Link>
      </div>
      <QuickLogDialog />
    </>
  )
}
