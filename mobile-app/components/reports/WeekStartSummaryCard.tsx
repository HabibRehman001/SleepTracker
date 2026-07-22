import { Link, type Href } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { fetchWeeklyStats } from '../services/weeklyStatsApi'
import {
  buildWeekStartInsight,
  isWeekStartDay,
  type WeekStartInsight,
} from '../services/weekStartSummaryMath'

type Props = {
  /** Force-show (e.g. screen); default only on Monday. */
  forceShow?: boolean
  now?: Date
}

/**
 * Step 204 — Insights-style card: auto on week-start (Monday).
 * Numbers come from GET /stats/weekly (passive-ongoing), not placeholders.
 */
export function WeekStartSummaryCard({
  forceShow = false,
  now = new Date(),
}: Props) {
  const [insight, setInsight] = useState<WeekStartInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visible = forceShow || isWeekStartDay(now)

  const load = useCallback(async () => {
    if (!visible) return
    setLoading(true)
    setError(null)
    try {
      const weekly = await fetchWeeklyStats()
      const built = buildWeekStartInsight(
        weekly.nights.map((n) => ({
          date: n.date,
          bedTime: n.bedTime,
          wakeTime: n.wakeTime,
          durationMinutes: n.durationMinutes,
          adherenceMinutes: n.adherenceMinutes,
        })),
        { avgAdherenceMinutes: weekly.avgAdherenceMinutes }
      )
      setInsight(built)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not load weekly summary.'
      )
      setInsight(null)
    } finally {
      setLoading(false)
    }
  }, [visible])

  useEffect(() => {
    void load()
  }, [load])

  if (!visible) return null

  return (
    <View
      className="bg-card border border-border rounded-lg px-4 py-4 mb-4 border-l-4 border-l-sidebar-primary"
      testID="week-start-summary-card"
    >
      <Text
        className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-2"
        testID="week-start-summary-eyebrow"
      >
        Insights
      </Text>
      <Text
        className="text-foreground text-[17px] font-semibold mb-2"
        testID="week-start-summary-headline"
      >
        {insight?.headline ?? 'Last week'}
      </Text>

      {loading ? (
        <ActivityIndicator color="#fafafa" testID="week-start-summary-loading" />
      ) : error ? (
        <Text
          className="text-muted-foreground text-sm leading-5"
          testID="week-start-summary-error"
        >
          {error}
        </Text>
      ) : insight ? (
        <Text
          className="text-muted-foreground text-[15px] leading-6"
          testID="week-start-summary-body"
        >
          {insight.body}
        </Text>
      ) : null}

      <Link href={'/week-start-summary' as Href} asChild>
        <Pressable className="mt-3 py-1" testID="week-start-summary-open">
          <Text className="text-sidebar-primary text-[14px] font-medium">
            Full week summary
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}
