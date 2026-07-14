import * as React from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ExperimentDiffCards } from '@/features/experiments/ExperimentDiffCards'
import { ExperimentQualityChart } from '@/features/experiments/ExperimentQualityChart'
import {
  formatExperimentDay,
  pickPrimaryMetric,
} from '@/features/experiments/experimentFormat'
import {
  useExperiment,
  useExperimentComparison,
} from '@/features/experiments/useExperiments'
import { useSleepEntries } from '@/features/sleep-entry'

/**
 * Step 100 — experiment detail: header, before/during/Δ cards, quality chart + start marker.
 */
export function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: experiment, isLoading, isError } = useExperiment(id)
  const { data: comparison, isLoading: cmpLoading } =
    useExperimentComparison(id)
  const { data: entries = [] } = useSleepEntries()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl" data-testid="experiment-detail-page">
        <p className="text-muted-foreground text-sm">Loading experiment…</p>
      </div>
    )
  }

  if (isError || !experiment) {
    return (
      <div className="mx-auto max-w-3xl space-y-3" data-testid="experiment-detail-page">
        <p className="text-sm">Experiment not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/experiments">Back to experiments</Link>
        </Button>
      </div>
    )
  }

  const primary = pickPrimaryMetric(comparison?.metrics ?? [])

  return (
    <React.Fragment>
      <div
        className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5"
        data-testid="experiment-detail-page"
        data-experiment-id={experiment.id}
      >
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link to="/experiments">
              <ArrowLeft className="size-4" />
              Experiments
            </Link>
          </Button>
          <header data-testid="experiment-detail-header">
            <h1 className="text-xl font-semibold tracking-tight">
              {experiment.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatExperimentDay(experiment.startDate)}
              {' → '}
              {formatExperimentDay(experiment.endDate)}
              {comparison ? (
                <span className="text-muted-foreground/80">
                  {' · '}
                  {comparison.beforeCount} before · {comparison.duringCount}{' '}
                  during
                </span>
              ) : null}
            </p>
          </header>
        </div>

        <section className="space-y-2">
          <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            Before / during
          </h2>
          <ExperimentDiffCards
            metric={primary}
            isLoading={cmpLoading}
          />
          {(comparison?.metrics.length ?? 0) > 1 ? (
            <div className="grid gap-4 pt-2">
              {comparison!.metrics
                .filter((m) => m.key !== primary?.key)
                .map((m) => (
                  <ExperimentDiffCards key={m.key} metric={m} />
                ))}
            </div>
          ) : null}
        </section>

        <section className="min-w-0 space-y-2">
          <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            Trend
          </h2>
          <ExperimentQualityChart
            entries={entries}
            startDate={experiment.startDate}
            endDate={experiment.endDate}
          />
        </section>
      </div>
    </React.Fragment>
  )
}
