import * as React from 'react'

import { cn } from '@/lib/utils'

export type ChartCardShellProps = {
  title: string
  children: React.ReactNode
  className?: string
  /** Plot area height; `'auto'` lets content (e.g. year heatmap) size itself. */
  height?: number | 'auto'
  empty?: boolean
  emptyMessage?: string
  'data-testid'?: string
}

/**
 * Shared chrome for chart wrappers — title, bordered card, fixed plot height.
 * `min-w-0` + `overflow-hidden` keep ResponsiveContainer from blowing the page width.
 */
export function ChartCardShell({
  title,
  children,
  className,
  height = 208,
  empty = false,
  emptyMessage = 'No data yet.',
  'data-testid': testId,
}: ChartCardShellProps) {
  return (
    <React.Fragment>
      <section
        className={cn(
          'min-w-0 max-w-full overflow-hidden rounded-md border border-border/80 bg-card/40 p-2 sm:p-3',
          className
        )}
        data-testid={testId}
      >
        <h2 className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wide uppercase sm:mb-3">
          {title}
        </h2>
        <div
          className="relative w-full min-w-0 max-w-full"
          style={height === 'auto' ? undefined : { height }}
        >
          {empty ? (
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      </section>
    </React.Fragment>
  )
}
