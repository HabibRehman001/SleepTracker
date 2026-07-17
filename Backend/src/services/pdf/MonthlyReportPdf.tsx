/**
 * Step 107 — Printable one-pager monthly PDF (@react-pdf/renderer).
 */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ComparedMetric, MonthlyReportSummary } from '../monthlyReport'

export type PdfReportProps = {
  month: string
  monthLabel: string
  summary: MonthlyReportSummary
  previous: MonthlyReportSummary
  metrics: ComparedMetric[]
  /** PNG buffer of the quality bar chart. */
  chartPng: Buffer
  insights: string[]
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  statDelta: {
    fontSize: 8,
    marginTop: 3,
    color: '#475569',
  },
  improved: { color: '#047857' },
  regressed: { color: '#b91c1c' },
  chartWrap: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  chartCaption: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 6,
  },
  chartImage: {
    width: 500,
    height: 150,
  },
  insight: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

function formatDuration(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  const m = Math.round(minutes)
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}h ${rem}m`
}

function formatQuality(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(1)
}

function metricFor(
  metrics: ComparedMetric[],
  key: string
): ComparedMetric | undefined {
  return metrics.find((m) => m.key === key)
}

function deltaLine(metric: ComparedMetric | undefined): string {
  if (!metric || metric.delta == null) return 'vs last month: —'
  const sign = metric.delta > 0 ? '+' : metric.delta < 0 ? '' : ''
  const abs =
    metric.key === 'avgDuration'
      ? `${Math.round(Math.abs(metric.delta))}m`
      : Math.abs(metric.delta).toFixed(1)
  const arrow =
    metric.tone === 'improved'
      ? '↑ improved'
      : metric.tone === 'regressed'
        ? '↓ regressed'
        : '→ steady'
  return `vs last month: ${sign}${metric.delta < 0 ? '−' : ''}${abs} ${arrow}`
}

/**
 * One-page monthly sleep report for PDF download.
 */
export function MonthlyReportPdfDocument({
  month,
  monthLabel,
  summary,
  metrics,
  chartPng,
  insights,
}: PdfReportProps) {
  const avgQ = metricFor(metrics, 'avgQuality')
  const avgD = metricFor(metrics, 'avgDuration')
  const best = metricFor(metrics, 'bestDayQuality')
  const worst = metricFor(metrics, 'worstDayQuality')

  return (
    <Document
      title={`SleepTracker ${month}`}
      author="SleepTracker"
      subject={`Monthly sleep report ${monthLabel}. Avg quality ${formatQuality(summary.avgQuality)}; Avg duration ${formatDuration(summary.avgDuration)}; Best ${formatQuality(summary.bestDayQuality)}; Worst ${formatQuality(summary.worstDayQuality)}; ${summary.entryCount} nights.`}
      keywords={`sleep, report, ${month}, quality, duration`}
    >
      <Page size="A4" style={styles.page} wrap={false}>
        <Text style={styles.title}>SleepTracker monthly report</Text>
        <Text style={styles.subtitle}>
          {monthLabel} ({month}) · {summary.entryCount} nights logged
        </Text>

        <Text style={styles.sectionTitle}>Key stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg quality</Text>
            <Text style={styles.statValue}>
              {formatQuality(summary.avgQuality)}
            </Text>
            <Text
              style={[
                styles.statDelta,
                avgQ?.tone === 'improved'
                  ? styles.improved
                  : avgQ?.tone === 'regressed'
                    ? styles.regressed
                    : {},
              ]}
            >
              {deltaLine(avgQ)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(summary.avgDuration)}
            </Text>
            <Text
              style={[
                styles.statDelta,
                avgD?.tone === 'improved'
                  ? styles.improved
                  : avgD?.tone === 'regressed'
                    ? styles.regressed
                    : {},
              ]}
            >
              {deltaLine(avgD)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best night</Text>
            <Text style={styles.statValue}>
              {formatQuality(summary.bestDayQuality)}
              {summary.bestDayDate ? ` · ${summary.bestDayDate}` : ''}
            </Text>
            <Text style={styles.statDelta}>{deltaLine(best)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Worst night</Text>
            <Text style={styles.statValue}>
              {formatQuality(summary.worstDayQuality)}
              {summary.worstDayDate ? ` · ${summary.worstDayDate}` : ''}
            </Text>
            <Text style={styles.statDelta}>{deltaLine(worst)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sleep quality by night</Text>
        <View style={styles.chartWrap}>
          <Text style={styles.chartCaption}>
            Daily sleep quality (1–10) — static chart for print
          </Text>
          <Image style={styles.chartImage} src={chartPng} />
        </View>

        {insights.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.slice(0, 6).map((line) => (
              <Text key={line} style={styles.insight}>
                • {line}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.insight}>No correlation insights for this month yet.</Text>
        )}

        <View style={styles.footer} fixed>
          <Text>SleepTracker</Text>
          <Text>Generated for {month} · one-page report</Text>
        </View>
      </Page>
    </Document>
  )
}
