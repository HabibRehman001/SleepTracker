import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryClient } from '@/lib/queryClient'
import type { Experiment } from '@/types/sleepEntry'

export const experimentsQueryKey = ['experiments'] as const

export const useExperiments = () =>
  useQuery({
    queryKey: experimentsQueryKey,
    queryFn: () => api.get<Experiment[]>('/experiments'),
  })

export const useCreateExperiment = () =>
  useMutation({
    mutationFn: (body: { name: string; startDate: string; endDate: string }) =>
      api.post<Experiment>('/experiments', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: experimentsQueryKey })
    },
  })
