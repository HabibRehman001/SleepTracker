import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MonthStatsColumn } from '../components/reports/MonthStatsColumn'
import { fetchMonthComparison } from '../services/monthlyReportApi'
import {
  buildReportMetrics,
  formatMonthLabel,
  type MonthComparisonDTO,
} from '../services/monthlyReportMath'

/**
 * Step 187 — Monthly Report: this month vs last, Phase 1 Reports layout.
 * Metrics: avg bedtime, avg duration, consistency, step count.
 */
export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comparison, setComparison] = useState<MonthComparisonDTO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMonthComparison()
      setComparison(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not load monthly comparison.'
      )
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const metrics = useMemo(
    () => (comparison ? buildReportMetrics(comparison) : []),
    [comparison]
  )

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 28,
      }}
      testID="monthly-report-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-2">
        Reports
      </Text>
      <Text className="text-foreground text-2xl font-semibold mb-1">
        Monthly report
      </Text>
      <Text
        className="text-muted-foreground text-[15px] leading-6 mb-5"
        testID="monthly-report-subtitle"
      >
        This month vs last — green arrows mean you improved.
      </Text>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator color="#fafafa" testID="monthly-report-loading" />
          <Text className="text-muted-foreground text-sm mt-3">
            Loading monthly report…
          </Text>
        </View>
      ) : error ? (
        <View className="py-10 items-center px-4" testID="monthly-report-error">
          <Text className="text-destructive text-center text-[15px] mb-4">
            {error}
          </Text>
          <Pressable
            className="bg-primary px-5 py-3 rounded-lg"
            onPress={() => void load()}
            testID="monthly-report-retry"
          >
            <Text className="text-primary-foreground font-semibold">Retry</Text>
          </Pressable>
        </View>
      ) : comparison &&
        comparison.thisMonth.sessionCount === 0 &&
        comparison.lastMonth.sessionCount === 0 ? (
        <View className="py-12 px-2" testID="monthly-report-empty">
          <Text className="text-foreground text-lg font-semibold mb-2 text-center">
            Nothing to compare yet
          </Text>
          <Text className="text-muted-foreground text-center text-[15px] leading-6">
            Log a few sleep nights and your monthly stats will show up here —
            side by side with last month.
          </Text>
        </View>
      ) : comparison ? (
        <>
          {comparison.improved || comparison.verdict?.improved ? (
            <View
              className="bg-card border border-border rounded-lg px-4 py-3 mb-4"
              testID="monthly-report-improved-badge"
            >
              <Text
                className="text-foreground text-sm font-medium text-center"
                testID="monthly-report-verdict-reason"
              >
                {comparison.verdict?.reason ??
                  'Overall improved vs last month'}
              </Text>
            </View>
          ) : comparison.verdict?.reason ? (
            <View
              className="bg-card border border-border rounded-lg px-4 py-3 mb-4"
              testID="monthly-report-verdict-badge"
            >
              <Text
                className="text-muted-foreground text-sm text-center"
                testID="monthly-report-verdict-reason"
              >
                {comparison.verdict.reason}
              </Text>
            </View>
          ) : null}

          <View
            className="flex-row gap-3 mb-5"
            testID="monthly-report-compare-grid"
          >
            <MonthStatsColumn
              title="This month"
              subtitle={`${formatMonthLabel(comparison.thisMonth.month)} · ${
                comparison.thisMonth.sessionCount
              } nights`}
              metrics={metrics}
              side="current"
              testID="monthly-report-this-month"
            />
            <MonthStatsColumn
              title="Last month"
              subtitle={`${formatMonthLabel(comparison.lastMonth.month)} · ${
                comparison.lastMonth.sessionCount
              } nights`}
              metrics={metrics}
              side="previous"
              testID="monthly-report-last-month"
            />
          </View>

          <Pressable
            className="border border-border py-3.5 rounded-lg items-center"
            onPress={() => void load()}
            testID="monthly-report-refresh"
          >
            <Text className="text-foreground font-semibold">Refresh</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  )
}
