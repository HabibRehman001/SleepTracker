import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useStatsSummary } from '@/features/dashboard'
import {
  LogEntryPage,
  SleepEntryCard,
  useSaveSleepEntry,
  useSleepEntries,
} from '@/features/sleep-entry'

/** Fixed UTC calendar day for Step 45 save→invalidate demo. */
const DEMO_DATE = '2099-04-04'

function DashboardPage() {
  const { data: entries = [], isLoading, dataUpdatedAt } = useSleepEntries()
  const { data: stats } = useStatsSummary()
  const saveEntry = useSaveSleepEntry()

  const saveTestNote = () => {
    const stamp = new Date().toISOString()
    saveEntry.mutate({
      date: DEMO_DATE,
      notes: `Step 45 auto-refresh ${stamp}`,
      sleepQuality: 7,
    })
  }

  const latest =
    entries.find((entry) => entry.date.startsWith(DEMO_DATE)) ??
    entries[entries.length - 1]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? 'loading…' : `${entries.length} entries`} · updated{' '}
          {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
        </p>
      </div>
      {stats ? (
        <p className="text-muted-foreground text-sm">
          avg7={stats.avg7day ?? '—'} · debt={stats.sleepDebt}m · consistency=
          {stats.consistencyScore}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => document.documentElement.classList.toggle('dark')}
        >
          Toggle theme
        </Button>
        <Button
          variant="secondary"
          onClick={saveTestNote}
          disabled={saveEntry.isPending}
        >
          {saveEntry.isPending ? 'Saving…' : 'Save entry (auto-refresh)'}
        </Button>
      </div>
      {latest ? (
        <div className="rounded-lg border border-border p-4">
          <SleepEntryCard entry={latest} />
        </div>
      ) : null}
    </div>
  )
}

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">{label}</h1>
      <p className="text-muted-foreground mt-1 text-sm">Coming in a later step.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogEntryPage />} />
        <Route path="analytics" element={<PlaceholderPage label="Analytics" />} />
        <Route
          path="experiments"
          element={<PlaceholderPage label="Experiments" />}
        />
        <Route path="reports" element={<PlaceholderPage label="Reports" />} />
        <Route path="settings" element={<PlaceholderPage label="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
