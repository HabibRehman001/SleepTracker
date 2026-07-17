import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  toastMutationError,
  toastMutationSuccess,
} from '@/lib/mutationToast'
import { queryClient } from '@/lib/queryClient'
import type { Experiment } from '@/types/sleepEntry'

export const experimentsQueryKey = ['experiments'] as const

export const experimentQueryKey = (id: string) =>
  ['experiments', id] as const

export const experimentComparisonQueryKey = (id: string) =>
  ['experiments', id, 'comparison'] as const

export type CreateExperimentInput = {
  name: string
  startDate: string
  /** Omit / null for open-ended ongoing experiments. */
  endDate?: string | null
}

export type ExperimentComparisonMetric = {
  key: string
  label: string
  unit: string
  beforeMean: number
  duringMean: number
  diff: number
  beforeN: number
  duringN: number
  pValue: number | null
  t: number | null
  df: number | null
  significant: boolean
}

export type ExperimentComparison = {
  experimentId: string
  beforeDays: number
  beforeCount: number
  duringCount: number
  metrics: ExperimentComparisonMetric[]
}

export const useExperiments = () =>
  useQuery({
    queryKey: experimentsQueryKey,
    queryFn: () => api.get<Experiment[]>('/experiments'),
  })

export const useExperiment = (id: string | undefined) =>
  useQuery({
    queryKey: experimentQueryKey(id ?? ''),
    queryFn: () => api.get<Experiment>(`/experiments/${id}`),
    enabled: Boolean(id),
  })

export const useExperimentComparison = (id: string | undefined) =>
  useQuery({
    queryKey: experimentComparisonQueryKey(id ?? ''),
    queryFn: () =>
      api.get<ExperimentComparison>(`/experiments/${id}/comparison`),
    enabled: Boolean(id),
  })

export const useCreateExperiment = () =>
  useMutation({
    mutationFn: (body: CreateExperimentInput) =>
      api.post<Experiment>('/experiments', body),
    onSuccess: () => {
      toastMutationSuccess('Experiment created')
      void queryClient.invalidateQueries({ queryKey: experimentsQueryKey })
    },
    onError: (err) => {
      toastMutationError(err, 'Could not create experiment')
    },
  })

export const useDeleteExperiment = () =>
  useMutation({
    mutationFn: (id: string) => api.delete(`/experiments/${id}`),
    onSuccess: () => {
      toastMutationSuccess('Experiment deleted')
      void queryClient.invalidateQueries({ queryKey: experimentsQueryKey })
    },
    onError: (err) => {
      toastMutationError(err, 'Could not delete experiment')
    },
  })
