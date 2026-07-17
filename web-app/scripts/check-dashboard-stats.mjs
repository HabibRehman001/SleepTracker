/**
 * Step 60 — useDashboardStats queryKey ['stats-summary'] + /stats/summary.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const hook = readFileSync(
  join(root, 'src/features/dashboard/useDashboardStats.ts'),
  'utf8'
)
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const save = readFileSync(
  join(root, 'src/features/sleep-entry/useSleepEntries.ts'),
  'utf8'
)

assert.match(hook, /export const useDashboardStats/)
assert.match(hook, /queryKey:\s*\[\s*['"]stats-summary['"]\s*\]/)
assert.match(hook, /api\.get.*\/stats\/summary/)
assert.match(page, /useDashboardStats/)
assert.match(save, /dashboardStatsQueryKey|stats-summary/)

console.log('useDashboardStats contract OK — queryKey stats-summary')
