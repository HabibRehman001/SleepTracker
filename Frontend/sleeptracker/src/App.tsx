import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout'
import { AnalyticsPage } from '@/features/analytics'
import { DashboardPage } from '@/features/dashboard'
import {
  ExperimentDetailPage,
  ExperimentsPage,
} from '@/features/experiments'
import { ReportsPage } from '@/features/reports'
import { LogEntryPage } from '@/features/sleep-entry'

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
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="experiments/:id" element={<ExperimentDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<PlaceholderPage label="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
