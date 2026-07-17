/**
 * Step 102–103 — Monthly report aggregator + month-over-month arrows.
 */
import {
  buildMonthOverMonthCompare,
  buildMonthlyReport,
  compareMonthlySummaries,
  entryMonthKey,
  maxBySleepQuality,
  minBySleepQuality,
  toMonthlyReportSummary,
  type MonthlyReportSummary,
} from '../src/services/monthlyReport'
import { sleepDurationMinutes } from '../src/services/analytics.service'
import { mean } from '../src/services/experimentComparison'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import { assert, assertClose, assertEqual, runTest } from './helpers'

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function summaryFixture(
  partial: Partial<MonthlyReportSummary> & { month: string }
): MonthlyReportSummary {
  return {
    entryCount: partial.entryCount ?? 10,
    avgDuration: partial.avgDuration ?? null,
    avgQuality: partial.avgQuality ?? null,
    bestDayQuality: partial.bestDayQuality ?? null,
    worstDayQuality: partial.worstDayQuality ?? null,
    bestDayDate: partial.bestDayDate ?? null,
    worstDayDate: partial.worstDayDate ?? null,
    insights: partial.insights ?? [],
    month: partial.month,
  }
}

export async function runMonthlyReportTests(): Promise<boolean> {
  console.log('\n[monthly.report]')
  const results: boolean[] = []

  results.push(
    await runTest(
      'empty month → null avg/best/worst and empty insights',
      () => {
        const report = buildMonthlyReport([], '2099-01')
        assertEqual(report.month, '2099-01', 'month')
        assertEqual(report.entryCount, 0, 'entryCount')
        assertEqual(report.avgDuration, null, 'avgDuration')
        assertEqual(report.avgQuality, null, 'avgQuality')
        assertEqual(report.bestDay, null, 'bestDay')
        assertEqual(report.worstDay, null, 'worstDay')
        assertEqual(report.insights.length, 0, 'insights')
      }
    )
  )

  results.push(
    await runTest(
      'month 2 better avg quality → all relevant arrows up/improved',
      () => {
        const previous = summaryFixture({
          month: '2026-05',
          avgQuality: 5,
          avgDuration: 400,
          bestDayQuality: 6,
          worstDayQuality: 3,
        })
        const current = summaryFixture({
          month: '2026-06',
          avgQuality: 8,
          avgDuration: 450,
          bestDayQuality: 9,
          worstDayQuality: 6,
        })

        const metrics = compareMonthlySummaries(current, previous)
        assert(metrics.length >= 4, 'expected quality + duration metrics')

        for (const m of metrics) {
          assertEqual(m.direction, 'up', `${m.key} direction`)
          assertEqual(m.tone, 'improved', `${m.key} tone (green)`)
          assert(m.delta != null && m.delta > 0, `${m.key} positive delta`)
        }

        const viaEntries = buildMonthOverMonthCompare([], '2026-06')
        assertEqual(viaEntries.currentMonth, '2026-06', 'currentMonth')
        assertEqual(viaEntries.previousMonth, '2026-05', 'previousMonth')
      }
    )
  )

  results.push(
    await runTest(
      'seeded month bestDay/worstDay match manual spot-check',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(
          entries.length >= 30,
          `need ≥30 seeded nights (got ${entries.length}) — run: npx prisma db seed`
        )

        const counts = new Map<string, number>()
        for (const e of entries) {
          const key = entryMonthKey(e.date)
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        let month = ''
        let maxCount = 0
        for (const [key, n] of counts) {
          if (n > maxCount) {
            maxCount = n
            month = key
          }
        }
        assert(month !== '', 'expected at least one month key')
        assert(
          maxCount >= 7,
          `expected a substantial month (got ${maxCount} in ${month})`
        )

        const monthEntries = entries.filter(
          (e) => entryMonthKey(e.date) === month
        )

        let manualBest = monthEntries[0] ?? null
        let manualWorst = monthEntries[0] ?? null
        let scanBestQ = -Infinity
        let scanWorstQ = Infinity
        for (const e of monthEntries) {
          if (!isFiniteNumber(e.sleepQuality)) continue
          if (e.sleepQuality > scanBestQ) {
            scanBestQ = e.sleepQuality
            manualBest = e
          }
          if (e.sleepQuality < scanWorstQ) {
            scanWorstQ = e.sleepQuality
            manualWorst = e
          }
        }
        assert(manualBest != null && Number.isFinite(scanBestQ), 'manual bestDay')
        assert(
          manualWorst != null && Number.isFinite(scanWorstQ),
          'manual worstDay'
        )
        assertEqual(
          maxBySleepQuality(monthEntries)?.id,
          manualBest.id,
          'maxBy helper ≡ manual best'
        )
        assertEqual(
          minBySleepQuality(monthEntries)?.id,
          manualWorst.id,
          'minBy helper ≡ manual worst'
        )

        const durations = monthEntries
          .map(sleepDurationMinutes)
          .filter(isFiniteNumber)
        const manualAvg = mean(durations)
        const qualities = monthEntries
          .map((e) => e.sleepQuality)
          .filter(isFiniteNumber)
        const manualAvgQuality = mean(qualities)

        const report = buildMonthlyReport(entries, month)
        const summary = toMonthlyReportSummary(report)

        assert(report.bestDay != null, 'report.bestDay')
        assert(report.worstDay != null, 'report.worstDay')
        assertEqual(
          report.bestDay.id,
          manualBest.id,
          `bestDay id (quality=${manualBest.sleepQuality} on ${dateKey(manualBest.date)})`
        )
        assertEqual(
          report.worstDay.id,
          manualWorst.id,
          `worstDay id (quality=${manualWorst.sleepQuality} on ${dateKey(manualWorst.date)})`
        )
        assertEqual(summary.bestDayQuality, scanBestQ, 'summary best quality')
        assertEqual(summary.worstDayQuality, scanWorstQ, 'summary worst quality')

        if (manualAvg == null) {
          assertEqual(report.avgDuration, null, 'avgDuration null')
        } else {
          assert(report.avgDuration != null, 'avgDuration present')
          assertClose(report.avgDuration, manualAvg, 1e-9, 'avgDuration')
        }
        if (manualAvgQuality == null) {
          assertEqual(report.avgQuality, null, 'avgQuality null')
        } else {
          assertClose(report.avgQuality!, manualAvgQuality, 1e-9, 'avgQuality')
        }

        assert(Array.isArray(report.insights), 'insights array')
      }
    )
  )

  return results.every(Boolean)
}
