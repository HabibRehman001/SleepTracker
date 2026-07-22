import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { WeekStartSummaryCard } from '../components/reports/WeekStartSummaryCard'
import { fetchWeeklyStats } from '../services/weeklyStatsApi'
import {
  buildWeekStartInsight,
  type WeekStartInsight,
} from '../services/weekStartSummaryMath'

/**
 * Step 204 — Start-of-week summary screen (notification deep link target).
 * Shows real numbers from the past 7 passive-ongoing sessions.
 */
export default function WeekStartSummaryScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<WeekStartInsight | null>(null)
  const [nightCount, setNightCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const weekly = await fetchWeeklyStats()
      setNightCount(weekly.nightCount)
      setInsight(
        buildWeekStartInsight(
          weekly.nights.map((n) => ({
            date: n.date,
            bedTime: n.bedTime,
            wakeTime: n.wakeTime,
            durationMinutes: n.durationMinutes,
            adherenceMinutes: n.adherenceMinutes,
          })),
          { avgAdherenceMinutes: weekly.avgAdherenceMinutes }
        )
      )
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not load weekly summary.'
      )
      setInsight(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 28,
      }}
      testID="week-start-summary-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-2">
        Insights
      </Text>
      <Text className="text-foreground text-2xl font-semibold mb-1">
        Start of week
      </Text>
      <Text
        className="text-muted-foreground text-[15px] leading-6 mb-5"
        testID="week-start-summary-screen-subtitle"
      >
        Last week from your passive sleep detection — not placeholders.
      </Text>

      <WeekStartSummaryCard forceShow />

      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator
            color="#fafafa"
            testID="week-start-summary-screen-loading"
          />
        </View>
      ) : error ? (
        <View className="py-6" testID="week-start-summary-screen-error">
          <Text className="text-muted-foreground text-sm mb-3">{error}</Text>
          <Pressable onPress={() => void load()} testID="week-start-summary-retry">
            <Text className="text-sidebar-primary text-[15px] font-medium">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : insight && !insight.isPlaceholder ? (
        <View
          className="mt-2"
          testID="week-start-summary-metrics"
        >
          <Text
            className="text-foreground text-[15px] mb-2"
            testID="week-start-summary-metric-bed"
          >
            Avg bedtime · {insight.avgBedTimeLabel}
          </Text>
          <Text
            className="text-foreground text-[15px] mb-2"
            testID="week-start-summary-metric-wake"
          >
            Avg wake · {insight.avgWakeTimeLabel}
          </Text>
          <Text
            className="text-foreground text-[15px] mb-2"
            testID="week-start-summary-metric-adherence"
          >
            Adherence · {insight.adherencePhrase}
          </Text>
          <Text
            className="text-foreground text-[15px] mb-2"
            testID="week-start-summary-metric-best"
          >
            Best night · {insight.bestNightLabel}
          </Text>
          <Text
            className="text-foreground text-[15px] mb-2"
            testID="week-start-summary-metric-drift"
          >
            Most drifted · {insight.mostDriftedNightLabel}
          </Text>
          <Text
            className="text-muted-foreground text-xs mt-3"
            testID="week-start-summary-night-count"
          >
            Based on {nightCount} passive-ongoing night
            {nightCount === 1 ? '' : 's'}.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  )
}
