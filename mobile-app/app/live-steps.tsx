import { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  PEDOMETER_HISTORY_PURPOSE,
  PEDOMETER_PURPOSE,
  PEDOMETER_STEP_TOLERANCE,
} from '../services/pedometer'
import {
  ACTIVITY_CLASSIFY_PURPOSE,
  JOG_CADENCE_MIN,
  RUN_CADENCE_MIN,
} from '../services/activityClassification'
import { usePedometerStore } from '../store/pedometerStore'

/**
 * Steps 181–183 — live pedometer, OS day totals, cadence → walk/jog/run.
 */
export default function LiveStepsScreen() {
  const insets = useSafeAreaInsets()
  const available = usePedometerStore((s) => s.available)
  const liveSteps = usePedometerStore((s) => s.liveSteps)
  const stepsPerMinute = usePedometerStore((s) => s.stepsPerMinute)
  const activityType = usePedometerStore((s) => s.activityType)
  const todaySteps = usePedometerStore((s) => s.todaySteps)
  const yesterdaySteps = usePedometerStore((s) => s.yesterdaySteps)
  const yesterdayRange = usePedometerStore((s) => s.yesterdayRange)
  const watching = usePedometerStore((s) => s.watching)
  const lastError = usePedometerStore((s) => s.lastError)
  const hydrateAvailability = usePedometerStore((s) => s.hydrateAvailability)
  const startWatch = usePedometerStore((s) => s.startWatch)
  const stopWatch = usePedometerStore((s) => s.stopWatch)
  const resetLive = usePedometerStore((s) => s.resetLive)
  const refreshTodaySteps = usePedometerStore((s) => s.refreshTodaySteps)
  const refreshHistoricalSteps = usePedometerStore(
    (s) => s.refreshHistoricalSteps
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await hydrateAvailability()
      if (cancelled) return
      await startWatch()
      await refreshTodaySteps()
      await refreshHistoricalSteps(1)
    })()
    return () => {
      cancelled = true
      stopWatch()
    }
  }, [
    hydrateAvailability,
    startWatch,
    stopWatch,
    refreshTodaySteps,
    refreshHistoricalSteps,
  ])

  const yesterdayLabel =
    yesterdayRange != null
      ? `${new Date(yesterdayRange.start).toLocaleDateString()} → ${new Date(
          yesterdayRange.end
        ).toLocaleDateString()}`
      : null

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
      testID="live-steps-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
        Pedometer
      </Text>
      <Text className="text-foreground text-2xl font-semibold mb-3">
        Live steps
      </Text>
      <Text
        className="text-muted-foreground text-[15px] leading-6 mb-6"
        testID="live-steps-purpose"
      >
        {PEDOMETER_PURPOSE} Walk ~20 steps with this screen open — the count
        should land within ±{PEDOMETER_STEP_TOLERANCE} of the true value.
      </Text>

      {available === null ? (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator color="#fafafa" />
        </View>
      ) : (
        <>
          <View
            className="bg-card border border-border rounded-lg px-4 py-6 mb-4 items-center"
            testID="live-steps-card"
          >
            <Text className="text-muted-foreground text-xs uppercase tracking-[0.16em] mb-2">
              Since watch started
            </Text>
            <Text
              className="text-foreground font-semibold tabular-nums"
              style={{ fontSize: 56, lineHeight: 64 }}
              testID="live-steps-count"
            >
              {liveSteps}
            </Text>
            <Text
              className="text-muted-foreground text-sm mt-3"
              testID="live-steps-status"
            >
              {available
                ? watching
                  ? 'Hardware pedometer watching…'
                  : 'Not watching'
                : 'Hardware pedometer not available (use a phone build)'}
            </Text>
          </View>

          <View
            className="bg-card border border-border rounded-lg px-4 py-4 mb-4"
            testID="live-steps-activity-card"
          >
            <Text className="text-muted-foreground text-xs uppercase tracking-[0.14em] mb-2">
              Activity (Step 183)
            </Text>
            <Text
              className="text-muted-foreground text-sm leading-5 mb-3"
              testID="live-steps-activity-purpose"
            >
              {ACTIVITY_CLASSIFY_PURPOSE}
            </Text>
            <Text
              className="text-foreground text-2xl font-semibold capitalize mb-1"
              testID="live-steps-activity-type"
            >
              {activityType ?? '—'}
            </Text>
            <Text
              className="text-muted-foreground text-sm tabular-nums"
              testID="live-steps-cadence"
            >
              {stepsPerMinute != null
                ? `${stepsPerMinute} steps/min`
                : `Cadence needs ~5s of walking (<${JOG_CADENCE_MIN} walk, <${RUN_CADENCE_MIN} jog, else run)`}
            </Text>
          </View>

          <View
            className="bg-card border border-border rounded-lg px-4 py-4 mb-4"
            testID="live-steps-history-card"
          >
            <Text className="text-muted-foreground text-xs uppercase tracking-[0.14em] mb-2">
              OS history (Step 182)
            </Text>
            <Text
              className="text-muted-foreground text-sm leading-5 mb-4"
              testID="live-steps-history-purpose"
            >
              {PEDOMETER_HISTORY_PURPOSE}
            </Text>
            <Text className="text-foreground text-[15px] mb-1">
              Today (since midnight)
            </Text>
            <Text
              className="text-foreground font-semibold tabular-nums text-2xl mb-4"
              testID="live-steps-today"
            >
              {todaySteps != null ? todaySteps : '—'}
            </Text>
            <Text className="text-foreground text-[15px] mb-1">Yesterday</Text>
            <Text
              className="text-foreground font-semibold tabular-nums text-2xl mb-1"
              testID="live-steps-yesterday"
            >
              {yesterdaySteps != null ? yesterdaySteps : '—'}
            </Text>
            {yesterdayLabel ? (
              <Text
                className="text-muted-foreground text-xs mb-2"
                testID="live-steps-yesterday-range"
              >
                {yesterdayLabel} (full calendar day)
              </Text>
            ) : (
              <Text className="text-muted-foreground text-xs mb-2">
                Whole-day total from OS — not steps since app launch.
              </Text>
            )}
          </View>

          {lastError ? (
            <Text
              className="text-muted-foreground text-center text-sm mb-4"
              testID="live-steps-error"
            >
              {lastError}
            </Text>
          ) : null}

          <Pressable
            className="bg-primary py-4 rounded-lg items-center mb-3"
            onPress={() => void resetLive()}
            disabled={!available}
            testID="live-steps-reset"
          >
            <Text className="text-primary-foreground text-base font-semibold">
              Reset session counter
            </Text>
          </Pressable>

          <Pressable
            className="border border-border py-4 rounded-lg items-center mb-3"
            onPress={() => {
              void refreshTodaySteps()
              void refreshHistoricalSteps(1)
            }}
            testID="live-steps-refresh-history"
          >
            <Text className="text-foreground text-base font-semibold">
              Refresh today + yesterday
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}
