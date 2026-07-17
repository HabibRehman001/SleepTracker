import { Link } from 'react-router'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const FIRST_NIGHT_CTA = 'Log your first night to see stats here'

export type EmptyStateProps = {
  title?: string
  description?: string
  /** Show link to /log (default true). */
  showLogCta?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * Step 109 — graceful first-use / no-data placeholder (not blank, not NaN).
 */
export function EmptyState({
  title = 'No sleep data yet',
  description = FIRST_NIGHT_CTA,
  showLogCta = true,
  className,
  'data-testid': testId = 'empty-state',
}: EmptyStateProps) {
  return (
    <React.Fragment>
      <div
        className={cn(
          'border-border/60 bg-card/40 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
          className
        )}
        data-testid={testId}
      >
        <p className="text-base font-medium tracking-tight">{title}</p>
        <p
          className="text-muted-foreground max-w-sm text-sm"
          data-testid="empty-state-description"
        >
          {description}
        </p>
        {showLogCta ? (
          <Button asChild size="sm" className="mt-1">
            <Link to="/log" data-testid="empty-state-log-cta">
              Log a night
            </Link>
          </Button>
        ) : null}
      </div>
    </React.Fragment>
  )
}
