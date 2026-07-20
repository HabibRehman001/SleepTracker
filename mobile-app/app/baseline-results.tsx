import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import {
  formatNightRange,
  liveSchedulePreview,
} from '../services/baselineDetection'
import { isValidHHMM } from '../services/nightDetection'
import { useBaselineStore } from '../store/baselineStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Steps 147–148 — “Here's what we found”: two nights + suggested schedule.
 * One round of manual nudge with a live preview, then Lock in (immutable in Step 150).
 */
export default function BaselineResultsScreen() {
  const insets = useSafeAreaInsets()
  const windows = useBaselineStore((s) => s.detectedWindows)
  const detectedBedtime = useBaselineStore((s) => s.detectedBedtime)
  const detectedWaketime = useBaselineStore((s) => s.detectedWaketime)
  const baselineReady = useBaselineStore((s) => s.baselineReady)
  const markBaselineResultsSeen = useBaselineStore(
    (s) => s.markBaselineResultsSeen
  )

  const setSchedule = useScheduleStore((s) => s.setSchedule)
  const lockIn = useScheduleStore((s) => s.lockIn)
  const lockedIn = useScheduleStore((s) => s.lockedIn)

  const seedBed = detectedBedtime ?? '04:00'
  const seedWake = detectedWaketime ?? '12:00'

  const [adjusting, setAdjusting] = useState(false)
  const [bedtime, setBedtime] = useState(seedBed)
  const [waketime, setWaketime] = useState(seedWake)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (detectedBedtime) setBedtime(detectedBedtime)
    if (detectedWaketime) setWaketime(detectedWaketime)
  }, [detectedBedtime, detectedWaketime])

  const nightA = windows[0]
  const nightB = windows[1]
  const rangeA = nightA
    ? formatNightRange(nightA.startIso, nightA.endIso)
    : null
  const rangeB = nightB
    ? formatNightRange(nightB.startIso, nightB.endIso)
    : null

  // Live preview from local nudge state (not frozen detected averages).
  const preview = liveSchedulePreview(bedtime, waketime, seedBed, seedWake)

  const confirmLockIn = () => {
    const bed = bedtime.trim()
    const wake = waketime.trim()
    if (!isValidHHMM(bed) || !isValidHHMM(wake)) {
      setError('Use 24h times like 04:00 and 12:00')
      return
    }
    setError(null)
    setSchedule(bed, wake)
    lockIn()
    markBaselineResultsSeen()
    router.replace('/')
  }

  if (!baselineReady && !lockedIn) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center px-8"
        testID="baseline-results-empty"
      >
        <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-4">
          We still need two clean nights before suggesting a schedule.
        </Text>
        <Pressable
          className="bg-primary px-5 py-3 rounded-lg"
          onPress={() => router.replace('/')}
        >
          <Text className="text-primary-foreground font-semibold">Back home</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }}
      testID="baseline-results-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-3">
        Baseline
      </Text>
      <Text
        className="text-foreground text-3xl font-semibold leading-tight mb-2"
        testID="baseline-results-title"
      >
        Here&apos;s what we found
      </Text>
      <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
        Auto-detected times are a suggestion. Nudge them once if needed — this
        is the last edit before the schedule locks in.
      </Text>

      <View className="flex-row gap-3 mb-6" testID="baseline-nights-row">
        <View
          className="flex-1 bg-card border border-border rounded-lg px-3 py-4"
          testID="baseline-night-1"
        >
          <Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
            Night 1
          </Text>
          <Text className="text-foreground text-[15px] font-semibold leading-6">
            {rangeA?.rangeLabel ?? '—'}
          </Text>
        </View>
        <View
          className="flex-1 bg-card border border-border rounded-lg px-3 py-4"
          testID="baseline-night-2"
        >
          <Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
            Night 2
          </Text>
          <Text className="text-foreground text-[15px] font-semibold leading-6">
            {rangeB?.rangeLabel ?? '—'}
          </Text>
        </View>
      </View>

      <View
        className="bg-card border border-border rounded-lg px-4 py-4 mb-6"
        testID="baseline-suggested-schedule"
      >
        <Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
          Suggested schedule
        </Text>
        <Text
          className="text-foreground text-xl font-semibold leading-7 mb-3"
          testID="baseline-suggested-line"
        >
          {preview}
        </Text>
        {adjusting ? (
          <View testID="baseline-adjust-fields">
            <Text className="text-muted-foreground text-sm mb-1">Bedtime</Text>
            <TextInput
              className="bg-background border border-border text-foreground rounded-lg px-3 py-3 mb-3 text-[16px]"
              value={bedtime}
              onChangeText={setBedtime}
              placeholder="04:00"
              autoCapitalize="none"
              autoCorrect={false}
              testID="baseline-adjust-bedtime"
            />
            <Text className="text-muted-foreground text-sm mb-1">Wake</Text>
            <TextInput
              className="bg-background border border-border text-foreground rounded-lg px-3 py-3 text-[16px]"
              value={waketime}
              onChangeText={setWaketime}
              placeholder="12:00"
              autoCapitalize="none"
              autoCorrect={false}
              testID="baseline-adjust-waketime"
            />
          </View>
        ) : null}
      </View>

      {error ? (
        <Text className="text-red-400 text-[14px] mb-3">{error}</Text>
      ) : null}

      <Pressable
        className="border border-border py-4 rounded-lg items-center mb-3"
        onPress={() => setAdjusting((v) => !v)}
        testID="baseline-adjust"
      >
        <Text className="text-foreground text-base font-semibold">
          {adjusting ? 'Done adjusting' : 'Adjust'}
        </Text>
      </Pressable>

      <Pressable
        className="bg-primary py-4 rounded-lg items-center"
        onPress={confirmLockIn}
        testID="baseline-lock-in"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Lock in schedule
        </Text>
      </Pressable>
    </View>
  )
}
