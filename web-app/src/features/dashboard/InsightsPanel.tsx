import * as React from 'react'
import { Lightbulb } from 'lucide-react'

import {
  useInsights,
  type AnalyticsDateRange,
} from '@/features/analytics'
import { cn } from '@/lib/utils'

export type InsightsPanelProps = {
  insights?: string[]
  isLoading?: boolean
  className?: string
  'data-testid'?: string
}

const EMPTY_COPY = 'Not enough data yet to surface patterns.'

/**
 * GitHub Insights–style callout: left accent, muted fill, bulleted patterns.
 * Presentational — feed ranked insight sentences from the API.
 */
export function InsightsPanelView({
  insights = [],
  isLoading = false,
  className,
  'data-testid': testId = 'insights-panel',
}: InsightsPanelProps) {
  if (isLoading) {
    return (
      <aside
        className={cn(
          'rounded-md border border-sky-500/25 border-l-4 border-l-sky-500 bg-sky-500/[0.06] px-4 py-3',
          className
        )}
        data-testid={testId}
        aria-busy="true"
      >
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-sky-500/20" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted/80" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-muted/80" />
        </div>
      </aside>
    )
  }

  return (
    <React.Fragment>
      <aside
        className={cn(
          'rounded-md border border-sky-500/25 border-l-4 border-l-sky-500 bg-sky-500/[0.06] px-4 py-3 dark:bg-sky-500/[0.08]',
          className
        )}
        data-testid={testId}
      >
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb
            className="size-4 shrink-0 text-sky-700 dark:text-sky-400"
            aria-hidden
          />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            This month&apos;s patterns
          </h3>
        </div>

        {insights.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="insights-empty"
          >
            {EMPTY_COPY}
          </p>
        ) : (
          <ul
            className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90"
            data-testid="insights-list"
          >
            {insights.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        )}
      </aside>
    </React.Fragment>
  )
}

/** Dashboard container — GET /analytics/insights → ranked bullets. */
export function InsightsPanel({
  className,
  range = 'all',
}: {
  className?: string
  range?: AnalyticsDateRange
}) {
  const { data: insights, isLoading, isFetching } = useInsights(range)

  return (
    <InsightsPanelView
      insights={insights}
      isLoading={isLoading || (isFetching && insights == null)}
      className={className}
    />
  )
}
