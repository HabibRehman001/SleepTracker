import { Trash2 } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatExperimentDay,
  pickPrimaryMetric,
  qualityChangeSummary,
} from '@/features/experiments/experimentFormat'
import { useExperimentComparison } from '@/features/experiments/useExperiments'
import type { Experiment } from '@/types/sleepEntry'
import { cn } from '@/lib/utils'

export type ExperimentListCardProps = {
  experiment: Experiment
  onDelete?: (id: string) => void
  deletePending?: boolean
  className?: string
}

/**
 * Step 101 — list card: name, date range, one-line quality % summary → detail.
 */
export function ExperimentListCard({
  experiment,
  onDelete,
  deletePending,
  className,
}: ExperimentListCardProps) {
  const { data: comparison, isLoading } = useExperimentComparison(experiment.id)
  const quality = pickPrimaryMetric(comparison?.metrics ?? [])
  const summary = isLoading
    ? 'Loading summary…'
    : qualityChangeSummary(
        quality?.key === 'sleepQuality' ? quality : undefined
      )

  return (
    <React.Fragment>
      <Card
        className={cn(
          'relative transition-colors hover:border-foreground/25',
          className
        )}
        data-testid={`experiment-card-${experiment.id}`}
      >
        <Link
          to={`/experiments/${experiment.id}`}
          className="absolute inset-0 z-0 rounded-xl"
          aria-label={`Open ${experiment.name}`}
        />
        <CardHeader className="relative z-10 pointer-events-none border-b pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {experiment.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {formatExperimentDay(experiment.startDate)}
                {' → '}
                {formatExperimentDay(experiment.endDate)}
              </CardDescription>
            </div>
            {onDelete ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive relative z-20 pointer-events-auto shrink-0"
                aria-label={`Delete ${experiment.name}`}
                disabled={deletePending}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(experiment.id)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pointer-events-none pt-3">
          <p
            className="text-sm text-foreground/90"
            data-testid={`experiment-summary-${experiment.id}`}
          >
            {summary}
          </p>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}
