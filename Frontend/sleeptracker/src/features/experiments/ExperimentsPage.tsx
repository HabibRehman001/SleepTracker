import * as React from 'react'
import { toast } from 'sonner'

import { ExperimentForm } from '@/features/experiments/ExperimentForm'
import { ExperimentListCard } from '@/features/experiments/ExperimentListCard'
import {
  useDeleteExperiment,
  useExperiments,
} from '@/features/experiments/useExperiments'

/**
 * Step 101 — Experiments list: create form + card grid (name, dates, quality %).
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
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : experiments.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-testid="experiments-empty"
          >
            No experiments yet.
          </p>
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
                  deleteExperiment.mutate(id, {
                    onSuccess: () => toast.success('Experiment deleted'),
                    onError: () => toast.error('Could not delete'),
                  })
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
