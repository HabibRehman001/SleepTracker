import * as React from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { SleepTrackerLoader } from '@/components/ui/Loader'
import { ExperimentForm } from '@/features/experiments/ExperimentForm'
import { ExperimentListCard } from '@/features/experiments/ExperimentListCard'
import {
  useDeleteExperiment,
  useExperiments,
} from '@/features/experiments/useExperiments'

/**
 * Step 101 — Experiments list; Step 109 — loader + empty state.
 */
export function ExperimentsPage() {
  const { data: experiments = [], isLoading } = useExperiments()
  const deleteExperiment = useDeleteExperiment()

  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5"
      data-testid="experiments-page"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Experiments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track before/after changes — name a window and log as usual.
        </p>
      </div>

      <section className="mx-auto w-full max-w-2xl space-y-2">
        <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          New experiment
        </h2>
        <ExperimentForm />
      </section>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          Your experiments
        </h2>
        {isLoading ? (
          <SleepTrackerLoader
            fullScreen={false}
            size="sm"
            label="Loading experiments…"
          />
        ) : experiments.length === 0 ? (
          <EmptyState
            title="No experiments yet"
            description="Create an experiment above to compare before vs during."
            showLogCta={false}
            data-testid="experiments-empty"
          />
        ) : (
          <div
            className="grid gap-3 sm:grid-cols-2"
            data-testid="experiments-card-grid"
          >
            {experiments.map((exp) => (
              <ExperimentListCard
                key={exp.id}
                experiment={exp}
                deletePending={deleteExperiment.isPending}
                onDelete={(id) => {
                  // Success/error toasts on useDeleteExperiment (Step 110).
                  deleteExperiment.mutate(id)
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

void React
