/**
 * Step 68 — Dashboard end-to-end: 30 seeded nights → every KPI / correlation
 * is a plausible non-placeholder value (same sources the frontend cards use).
 */
import {
  FACTORS,
  MIN_CORRELATION_GROUP_N,
  OUTCOMES,
  computeCorrelations,
  computeSummary,
} from '../src/services/analytics.service'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import { assert, runTest } from './helpers'

const CLOCK_RE = /^\d{2}:\d{2}$/
const PLACEHOLDER = /^(—|--|\.\.\.|n\/a|todo|placeholder)$/i

function assertRealNumber(
  value: number | null | undefined,
  label: string,
  opts: { min?: number; max?: number; allowZero?: boolean } = {}
): asserts value is number {
  assert(value != null, `${label} must be present (not null)`)
  assert(Number.isFinite(value), `${label} must be finite (got ${value})`)
  assert(!Number.isNaN(value), `${label} must not be NaN`)
  if (opts.min != null) {
    assert(value >= opts.min, `${label}=${value} below min ${opts.min}`)
  }
  if (opts.max != null) {
    assert(value <= opts.max, `${label}=${value} above max ${opts.max}`)
  }
  if (opts.allowZero === false) {
    assert(value !== 0, `${label} should be non-zero`)
  }
}

function assertNotPlaceholder(value: string | null | undefined, label: string) {
  assert(value != null && value !== '', `${label} missing`)
  assert(!PLACEHOLDER.test(value), `${label} is placeholder: ${value}`)
}

export async function runDashboardE2ETests(): Promise<boolean> {
  console.log('\n[dashboard.e2e]')
  const results: boolean[] = []

  results.push(
    await runTest(
      '30 seeded days drive all dashboard stats + correlation cards',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(
          entries.length >= 30,
          `need ≥30 seeded nights (got ${entries.length}) — run: npx prisma db seed`
        )

        const sorted = [...entries].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        )

        // Mix checks required by Step 68
        let phoneYes = 0
        let phoneNo = 0
        let weekend = 0
        let weekday = 0
        for (const e of sorted) {
          const phone = e.environment?.phoneUsedBeforeSleep
          if (phone === true) phoneYes += 1
          else if (phone === false) phoneNo += 1
          const dow = e.date.getDay()
          if (dow === 0 || dow === 6) weekend += 1
          else weekday += 1
        }
        assert(phoneYes > 0 && phoneNo > 0, `phone mix yes=${phoneYes} no=${phoneNo}`)
        assert(
          weekend > 0 && weekday > 0,
          `weekday/weekend mix weekend=${weekend} weekday=${weekday}`
        )

        const summary = computeSummary(sorted)

        // Highlight + KPI strip fields (Today / Debt / Avg7 / Avg30 / Consistency / clocks / latency)
        assertRealNumber(summary.todaySleep, 'todaySleep', { min: 0.5, max: 16 })
        assertRealNumber(summary.sleepDebt, 'sleepDebt', { min: 0 })
        assertRealNumber(summary.avg7day, 'avg7day', { min: 0.5, max: 16 })
        assertRealNumber(summary.avg30day, 'avg30day', { min: 0.5, max: 16 })
        assertRealNumber(summary.consistencyScore, 'consistencyScore', {
          min: 0,
          max: 100,
        })
        assertNotPlaceholder(summary.avgBedtime, 'avgBedtime')
        assert(
          CLOCK_RE.test(summary.avgBedtime!),
          `avgBedtime clock form got ${summary.avgBedtime}`
        )
        assertNotPlaceholder(summary.avgWakeTime, 'avgWakeTime')
        assert(
          CLOCK_RE.test(summary.avgWakeTime!),
          `avgWakeTime clock form got ${summary.avgWakeTime}`
        )
        assertRealNumber(summary.avgLatency, 'avgLatency', { min: 0, max: 300 })

        // with 30 nights, 7d and 30d averages should both be populated and close-ish
        assert(
          Math.abs(summary.avg7day! - summary.avg30day!) < 4,
          `avg7 (${summary.avg7day}) vs avg30 (${summary.avg30day}) implausible gap`
        )

        const correlations = computeCorrelations(sorted)
        assert(
          correlations.length > 0 &&
            correlations.length <= FACTORS.length * OUTCOMES.length,
          `expected 1..${FACTORS.length * OUTCOMES.length} confident cards, got ${correlations.length}`
        )

        for (const c of correlations) {
          for (const side of ['groupA', 'groupB'] as const) {
            const g = c[side]
            assert(
              g.n >= MIN_CORRELATION_GROUP_N,
              `${c.factor}/${c.outcome}.${side} n=${g.n} < ${MIN_CORRELATION_GROUP_N}`
            )
            const max = c.outcome === 'quality' ? 10 : 1000
            const min = c.outcome === 'quality' ? 1 : 0
            assertRealNumber(g.avg, `${c.factor}/${c.outcome}.${side}.avg`, {
              min,
              max,
            })
          }
        }

        const phoneLatency = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
        )
        const phoneQuality = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'quality'
        )
        assert(phoneLatency != null, 'phone vs latency present')
        assert(phoneQuality != null, 'phone vs quality present')
        assert(
          phoneLatency!.groupA.avg! > phoneLatency!.groupB.avg!,
          'seeded phone nights should have higher latency than no-phone'
        )

        console.log(
          `    nights=${sorted.length} todaySleep=${summary.todaySleep} debt=${summary.sleepDebt}m ` +
            `avg7=${summary.avg7day} avg30=${summary.avg30day} consistency=${summary.consistencyScore}`
        )
        console.log(
          `    bed=${summary.avgBedtime} wake=${summary.avgWakeTime} latency=${summary.avgLatency}m`
        )
        console.log(
          `    phone vs latency yes n=${phoneLatency!.groupA.n} avg=${phoneLatency!.groupA.avg} | ` +
            `no n=${phoneLatency!.groupB.n} avg=${phoneLatency!.groupB.avg}`
        )
      }
    )
  )

  return results.every(Boolean)
}
