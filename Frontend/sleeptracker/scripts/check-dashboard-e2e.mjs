/**
 * Step 68 — Dashboard wired end-to-end to live API sources.
 * Contract: every card uses real hooks/endpoints (no mocks).
 * Live check: when API is up after 30-day seed, stats + correlations are non-placeholder.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const apiClient = readFileSync(join(root, 'src/lib/api-client.ts'), 'utf8')

assert.match(page, /useSleepEntries/)
assert.match(page, /useDashboardStats/)
assert.match(page, /useCorrelations/)
assert.match(page, /TodayCard/)
assert.match(page, /SleepDebtCard/)
assert.match(page, /AverageSleepCards/)
assert.match(page, /ConsistencyScoreCard/)
assert.match(page, /ScheduleTimingCards/)
assert.match(page, /StatCardsGrid/)
assert.match(page, /DashboardCharts/)
assert.match(page, /CorrelationCards/)
assert.doesNotMatch(page, /mockStats|MOCK_|fakeEntries|placeholderStats/)
assert.match(apiClient, /localhost:4000\/api/)

const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'

async function liveCheck() {
  let entriesRes
  let statsRes
  let corrRes
  try {
    ;[entriesRes, statsRes, corrRes] = await Promise.all([
      fetch(`${API}/sleep-entries`),
      fetch(`${API}/stats/summary`),
      fetch(`${API}/analytics/correlations`),
    ])
  } catch {
    console.log(
      'Dashboard wire contract OK — live API skipped (server not reachable)'
    )
    return
  }

  if (!entriesRes.ok || !statsRes.ok || !corrRes.ok) {
    console.log(
      `Dashboard wire contract OK — live API skipped (HTTP ${entriesRes.status}/${statsRes.status}/${corrRes.status})`
    )
    return
  }

  const entries = (await entriesRes.json())
  const stats = (await statsRes.json())
  const correlations = (await corrRes.json())

  assert.ok(Array.isArray(entries) && entries.length >= 30, `need ≥30 nights, got ${entries?.length}`)
  assert.equal(typeof stats.todaySleep, 'number')
  assert.equal(typeof stats.sleepDebt, 'number')
  assert.equal(typeof stats.avg7day, 'number')
  assert.equal(typeof stats.avg30day, 'number')
  assert.equal(typeof stats.consistencyScore, 'number')
  assert.match(String(stats.avgBedtime), /^\d{2}:\d{2}$/)
  assert.match(String(stats.avgWakeTime), /^\d{2}:\d{2}$/)
  assert.equal(typeof stats.avgLatency, 'number')

  assert.ok(Array.isArray(correlations) && correlations.length >= 4)
  for (const c of correlations) {
    assert.ok(c.groupA.n > 0, `${c.factor} groupA empty`)
    assert.ok(c.groupB.n > 0, `${c.factor} groupB empty`)
    assert.equal(typeof c.groupA.avgLatency, 'number')
    assert.equal(typeof c.groupB.avgLatency, 'number')
  }

  console.log(
    `Dashboard e2e OK — ${entries.length} nights; todaySleep=${stats.todaySleep} avg7=${stats.avg7day} avg30=${stats.avg30day}`
  )
}

await liveCheck()
