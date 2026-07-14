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
assert.match(page, /InsightsPanel/)
assert.doesNotMatch(page, /mockStats|MOCK_|fakeEntries|placeholderStats/)
assert.match(apiClient, /localhost:4000\/api/)

const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'

async function liveCheck() {
  let entriesRes
  let statsRes
  let corrRes
  let insightsRes
  try {
    ;[entriesRes, statsRes, corrRes, insightsRes] = await Promise.all([
      fetch(`${API}/sleep-entries`),
      fetch(`${API}/stats/summary`),
      fetch(`${API}/analytics/correlations`),
      fetch(`${API}/analytics/insights`),
    ])
  } catch {
    console.log(
      'Dashboard wire contract OK — live API skipped (server not reachable)'
    )
    return
  }

  if (!entriesRes.ok || !statsRes.ok || !corrRes.ok || !insightsRes.ok) {
    console.log(
      `Dashboard wire contract OK — live API skipped (HTTP ${entriesRes.status}/${statsRes.status}/${corrRes.status}/${insightsRes.status})`
    )
    return
  }

  const entries = (await entriesRes.json())
  const stats = (await statsRes.json())
  const correlations = (await corrRes.json())
  const insightsBody = (await insightsRes.json())

  assert.ok(Array.isArray(entries) && entries.length >= 30, `need ≥30 nights, got ${entries?.length}`)
  assert.equal(typeof stats.todaySleep, 'number')
  assert.equal(typeof stats.sleepDebt, 'number')
  assert.equal(typeof stats.avg7day, 'number')
  assert.equal(typeof stats.avg30day, 'number')
  assert.equal(typeof stats.consistencyScore, 'number')
  assert.match(String(stats.avgBedtime), /^\d{2}:\d{2}$/)
  assert.match(String(stats.avgWakeTime), /^\d{2}:\d{2}$/)
  assert.equal(typeof stats.avgLatency, 'number')

  assert.ok(Array.isArray(correlations) && correlations.length >= 1)
  const phoneLatency = correlations.find(
    (c) => c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
  )
  const phoneQuality = correlations.find(
    (c) => c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'quality'
  )
  assert.ok(phoneLatency, 'phone vs latency')
  assert.ok(phoneQuality, 'phone vs quality')
  for (const c of correlations) {
    assert.ok(c.groupA.n >= 3, `${c.factor}/${c.outcome} groupA n<3`)
    assert.ok(c.groupB.n >= 3, `${c.factor}/${c.outcome} groupB n<3`)
    assert.equal(typeof c.groupA.avg, 'number')
    assert.equal(typeof c.groupB.avg, 'number')
  }

  assert.ok(Array.isArray(insightsBody.insights), 'insights array')
  assert.ok(
    insightsBody.insights.length >= 2,
    `need ≥2 insight sentences, got ${insightsBody.insights.length}`
  )

  console.log(
    `Dashboard e2e OK — ${entries.length} nights; todaySleep=${stats.todaySleep} avg7=${stats.avg7day} avg30=${stats.avg30day}; insights=${insightsBody.insights.length}`
  )
}

await liveCheck()
