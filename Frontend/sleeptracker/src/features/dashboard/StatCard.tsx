import * as React from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type StatCardProps = {
  label: string
  /** Pre-formatted display value — time ("3h 40m"), score ("72"), clock ("23:15"), etc. */
  value: ReactNode
  /** Optional secondary line, e.g. "+20m vs last week" — presentation only. */
  trend?: string
  hint?: string
  className?: string
  isLoading?: boolean
  'data-testid'?: string
}

/**
 * Pure presentation KPI tile (Step 61).
 * No data fetching or formatting logic — parent supplies label/value/trend strings.
 */
export function StatCard({
  label,
  value,
  trend,
  hint,
  className,
  isLoading,
  'data-testid': testId = 'stat-card',
}: StatCardProps) {
  return (
    <React.Fragment>
      <div
        data-testid={testId}
        title={hint}
        className={cn(
          'flex min-h-[5.5rem] flex-col justify-between gap-1 rounded-md border border-border/80 bg-card/40 px-2.5 py-2',
          isLoading && 'animate-pulse',
          className
        )}
      >
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-auto space-y-0.5">
          <p
            className="text-foreground font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl"
            data-testid={`${testId}-value`}
          >
            {value}
          </p>
          {trend ? (
            <p
              className="text-muted-foreground text-[10px] tabular-nums"
              data-testid={`${testId}-trend`}
            >
              {trend}
            </p>
          ) : null}
        </div>
      </div>
    </React.Fragment>
  )
}
