import { useMutation, useQuery } from '@tanstack/react-query'
import { dashboardStatsQueryKey } from '@/features/dashboard/useDashboardStats'
import { api } from '@/lib/api-client'
import {
  toastMutationError,
  toastMutationSuccess,
} from '@/lib/mutationToast'
import { queryClient } from '@/lib/queryClient'
import type { SleepEntry, SleepEntryWrite } from '@/types/sleepEntry'

export const sleepEntriesQueryKey = ['sleep-entries'] as const

/** YYYY-MM-DD for the route + optional write fields for the body. */
export type SaveSleepEntryInput = SleepEntryWrite & {
  date: string
}

export const useSleepEntries = () =>
  useQuery({
    queryKey: sleepEntriesQueryKey,
    queryFn: () => api.get<SleepEntry[]>('/sleep-entries'),
  })

export const useSaveSleepEntry = () =>
  useMutation({
    mutationFn: ({ date, ...body }: SaveSleepEntryInput) =>
      api.put<SleepEntry>(`/sleep-entries/${date}`, body),
    onSuccess: () => {
      toastMutationSuccess('Saved')
      void queryClient.invalidateQueries({ queryKey: sleepEntriesQueryKey })
      void queryClient.invalidateQueries({ queryKey: dashboardStatsQueryKey })
    },
    onError: (err) => {
      toastMutationError(err, 'Could not save sleep entry')
    },
  })
