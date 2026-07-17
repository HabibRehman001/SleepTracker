import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'

import {
  correlationsQueryKey,
  insightsQueryKey,
  patternsQueryKey,
  scatterQueryKey,
} from '@/features/analytics'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { dashboardStatsQueryKey } from '@/features/dashboard/useDashboardStats'
import { sleepEntriesQueryKey } from '@/features/sleep-entry/useSleepEntries'
import type { SleepEntry } from '@/types/sleepEntry'

const mockEntry: SleepEntry = {
  id: 'entry-1',
  date: '2026-07-17T00:00:00.000Z',
  bedTime: '2026-07-16T23:00:00.000Z',
  attemptSleepTime: '2026-07-16T23:15:00.000Z',
  estimatedSleepTime: '2026-07-16T23:30:00.000Z',
  wakeTime: '2026-07-17T07:00:00.000Z',
  outOfBedTime: '2026-07-17T07:15:00.000Z',
  numberOfAwakenings: 1,
  sleepQuality: 8,
  energyMorning: 7,
  energyWork: 6,
  notes: 'Mock night',
  createdAt: '2026-07-17T08:00:00.000Z',
  updatedAt: '2026-07-17T08:00:00.000Z',
  mood: null,
  food: null,
  exercise: null,
  environment: null,
  health: null,
}

function createClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })

  client.setQueryData(sleepEntriesQueryKey, [mockEntry])
  client.setQueryData(dashboardStatsQueryKey, {
    todaySleep: 7.5,
    sleepDebt: 30,
    avg7day: 7.2,
    avg30day: 7.0,
    consistencyScore: 88,
    avgBedtime: '23:00',
    avgWakeTime: '07:00',
    avgLatency: 25,
  })
  client.setQueryData(correlationsQueryKey('all'), [
    {
      factor: 'phoneUsedBeforeSleep',
      outcome: 'latency',
      label: 'Phone before sleep vs latency',
      groupA: { label: 'YES', avg: 87, n: 5 },
      groupB: { label: 'NO', avg: 21, n: 4 },
    },
  ])
  client.setQueryData(scatterQueryKey('all'), [])
  client.setQueryData(insightsQueryKey('all'), [
    'Phone use before bed is linked to longer sleep latency.',
  ])
  client.setQueryData(patternsQueryKey('all'), {
    warnings: [],
    highlights: [],
  })

  return client
}

function wrap(ui: ReactNode, client = createClient()) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  it('renders with mock query data (not empty / not loading)', () => {
    wrap(<DashboardPage />)

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText(/1 nights/i)).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('highlight-cards')).toBeInTheDocument()
    expect(screen.getByTestId('today-card')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-correlations')).toBeInTheDocument()
  })
})
