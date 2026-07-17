import * as React from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'

import {
  useSmartPatterns,
  type PatternHighlight,
  type PatternWarning,
} from '@/features/analytics'
import { cn } from '@/lib/utils'

export type PatternsDetectedCardProps = {
  warnings?: PatternWarning[]
  highlights?: PatternHighlight[]
  isLoading?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * Step 96 — Patterns Detected: amber warning banners only when jetlag/drift
 * actually fire; quiet highlights for streaks / records / debt.
 */
export function PatternsDetectedCardView({
  warnings = [],
  highlights = [],
  isLoading = false,
  className,
  'data-testid': testId = 'patterns-detected-card',
}: PatternsDetectedCardProps) {
  if (isLoading) {
    return (
      <aside
        className={cn(
          'rounded-md border border-border/80 bg-card/40 px-4 py-3',
          className
        )}
        data-testid={testId}
        aria-busy="true"
      >
        <div className="mb-2 h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted/80" />
      </aside>
    )
  }

  return (
    <React.Fragment>
      <aside
        className={cn(
          'rounded-md border border-border/80 bg-card/40 px-4 py-3',
          className
        )}
        data-testid={testId}
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles
            className="size-4 shrink-0 text-foreground/70"
            aria-hidden
          />
          <h3 className="text-sm font-semibold tracking-tight">
            Patterns Detected
          </h3>
        </div>

        {warnings.length === 0 && highlights.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="patterns-empty"
          >
            Not enough data to detect patterns yet.
          </p>
        ) : (
          <div className="space-y-2">
            {warnings.map((w) => (
              <div
                key={w.key}
                role="status"
                data-testid={`pattern-warning-${w.key}`}
                className="flex gap-2 rounded-md border border-amber-500/35 border-l-4 border-l-amber-500 bg-amber-500/[0.08] px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <p>{w.message}</p>
              </div>
            ))}

            {highlights.length > 0 ? (
              <ul
                className="text-muted-foreground list-disc space-y-1 pl-5 text-sm"
                data-testid="pattern-highlights"
              >
                {highlights.map((h) => (
                  <li key={h.key}>{h.message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </aside>
    </React.Fragment>
  )
}

export function PatternsDetectedCard({ className }: { className?: string }) {
  const { data, isLoading, isFetching } = useSmartPatterns()

  return (
    <PatternsDetectedCardView
      warnings={data?.warnings}
      highlights={data?.highlights}
      isLoading={isLoading || (isFetching && data == null)}
      className={className}
    />
  )
}
