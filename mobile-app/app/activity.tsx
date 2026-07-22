import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

import { ActivityBreakdown } from '../components/activity/ActivityBreakdown'
import { StepGoalRing } from '../components/activity/StepGoalRing'
import { WeekStepsChart } from '../components/activity/WeekStepsChart'
import {
  fetchSevenDayStepSeries,
  loadActivityMinutes,
} from '../services/activityHistory'
import {
  buildWeekStepBars,
  DEFAULT_DAILY_STEP_GOAL,
  resolveActivityMinutes,
  type ActivityMinutes,
} from '../services/activityScreenMath'
import { usePedometerStore } from '../store/pedometerStore'

/**
 * Step 184 — Activity: today steps + goal ring, 7-day bars, walk/jog/run minutes.
 */
export default function ActivityScreen() {
  const insets = useSafeAreaInsets()
  const todayFromStore = usePedometerStore((s) => s.todaySteps)
  const liveSteps = usePedometerStore((s) => s.liveSteps)
  const storeMinutes = usePedometerStore((s) => s.activityMinutes)
  const refreshTodaySteps = usePedometerStore((s) => s.refreshTodaySteps)
  const hydrateAvailability = usePedometerStore((s) => s.hydrateAvailability)
  const startWatch = usePedometerStore((s) => s.startWatch)

  const [loading, setLoading] = useState(true)
  const [series, setSeries] = useState<
    Array<{ daysAgo: number; steps: number | null }>
  >([])
  const [trackedMinutes, setTrackedMinutes] = useState<ActivityMinutes>({
    walk: 0,
    jog: 0,
    run: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await hydrateAvailability()
      await refreshTodaySteps()
      const [week, minutes] = await Promise.all([
        fetchSevenDayStepSeries(),
        loadActivityMinutes(),
      ])
      setSeries(week)
      setTrackedMinutes(minutes)
      void startWatch()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load activity')
    } finally {
      setLoading(false)
    }
  }, [hydrateAvailability, refreshTodaySteps, startWatch])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTrackedMinutes(storeMinutes)
  }, [storeMinutes])

  const todaySteps = useMemo(() => {
    const fromHistory = series.find((d) => d.daysAgo === 0)?.steps
    const candidates = [todayFromStore, fromHistory].filter(
      (n): n is number => n != null && Number.isFinite(n)
    )
    const best = candidates.length ? Math.max(...candidates) : 0
    // Session live steps are since watch started — don't replace day total.
    return best > 0 ? best : liveSteps
  }, [series, todayFromStore, liveSteps])

  const bars = useMemo(() => {
    const merged = series.map((d) =>
      d.daysAgo === 0 ? { ...d, steps: todaySteps } : d
    )
    if (!merged.some((d) => d.daysAgo === 0)) {
      merged.push({ daysAgo: 0, steps: todaySteps })
    }
    return buildWeekStepBars(merged)
  }, [series, todaySteps])

  const minutes = resolveActivityMinutes(trackedMinutes, todaySteps)

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 28,
      }}
      testID="activity-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-2">
        Activity
      </Text>
      <Text className="text-foreground text-2xl font-semibold mb-1">
        Today
      </Text>
      <Text className="text-muted-foreground text-sm leading-5 mb-6">
        Steps toward your daily goal, the last 7 days, and walk / jog / run
        minutes.
      </Text>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator color="#fafafa" />
        </View>
      ) : (
        <>
          <View className="items-center mb-8">
            <StepGoalRing steps={todaySteps} goal={DEFAULT_DAILY_STEP_GOAL} />
          </View>

          <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
            Last 7 days
          </Text>
          <View className="bg-card border border-border rounded-lg px-3 py-4 mb-6">
            <WeekStepsChart bars={bars} />
          </View>

          <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
            Walk / jog / run
          </Text>
          <View className="bg-card border border-border rounded-lg px-4 py-4 mb-6">
            <ActivityBreakdown minutes={minutes} />
          </View>

          {error ? (
            <Text className="text-destructive text-sm text-center mb-4">
              {error}
            </Text>
          ) : null}

          <Pressable
            className="bg-primary py-3.5 rounded-lg items-center mb-3"
            onPress={() => void load()}
            testID="activity-refresh"
          >
            <Text className="text-primary-foreground font-semibold">
              Refresh
            </Text>
          </Pressable>

          <Link href="/live-steps" asChild>
            <Pressable className="py-3 items-center" testID="activity-open-live-steps">
              <Text className="text-sidebar-primary text-[15px] font-medium">
                Live pedometer
              </Text>
            </Pressable>
          </Link>
        </>
      )}
    </ScrollView>
  )
}
