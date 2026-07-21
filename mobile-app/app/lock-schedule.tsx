import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HoldToConfirm } from '../components/HoldToConfirm'
import { formatSuggestedSchedule } from '../services/baselineDetection'
import { isValidHHMM } from '../services/nightDetection'
import { lockSchedule } from '../services/scheduleApi'
import { syncScheduledLockTrigger } from '../services/syncScheduledLock'
import { useBaselineStore } from '../store/baselineStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Step 150 — serious confirmation before the schedule becomes immutable.
 */
export default function LockScheduleScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    sleepTime?: string
    wakeTime?: string
  }>()

  const storeBed = useScheduleStore((s) => s.bedtime)
  const storeWake = useScheduleStore((s) => s.waketime)
  const lockedIn = useScheduleStore((s) => s.lockedIn)
  const setSchedule = useScheduleStore((s) => s.setSchedule)
  const applyLockedSchedule = useScheduleStore((s) => s.applyLockedSchedule)
  const markBaselineResultsSeen = useBaselineStore(
    (s) => s.markBaselineResultsSeen
  )

  const sleepTime = String(params.sleepTime ?? storeBed ?? '').trim()
  const wakeTime = String(params.wakeTime ?? storeWake ?? '').trim()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = isValidHHMM(sleepTime) && isValidHHMM(wakeTime)
  const preview = valid
    ? formatSuggestedSchedule(sleepTime, wakeTime)
    : 'Set a sleep schedule first'

  const onConfirm = async () => {
    if (!valid || busy || lockedIn) return
    setBusy(true)
    setError(null)
    setSchedule(sleepTime, wakeTime)
    try {
      const locked = await lockSchedule(sleepTime, wakeTime)
      applyLockedSchedule(
        locked.sleepTime,
        locked.wakeTime,
        locked.lockedAt ?? new Date().toISOString()
      )
      markBaselineResultsSeen()
      await syncScheduledLockTrigger()
      router.replace('/')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not lock schedule'
      if (/already locked/i.test(message)) {
        // Treat as success sync if server already has it
        applyLockedSchedule(sleepTime, wakeTime, new Date().toISOString())
        markBaselineResultsSeen()
        await syncScheduledLockTrigger()
        router.replace('/')
        return
      }
      setError(message)
      setBusy(false)
    }
  }

  if (lockedIn) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        testID="lock-schedule-already"
      >
        <Text className="text-foreground text-xl font-semibold text-center mb-3">
          Schedule already locked
        </Text>
        <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-6">
          Sleep and wake times cannot be changed.
        </Text>
        <Pressable
          className="bg-primary px-5 py-3 rounded-lg"
          onPress={() => router.replace('/settings')}
        >
          <Text className="text-primary-foreground font-semibold">
            View in Settings
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }}
      testID="lock-schedule-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-3">
        Final step
      </Text>
      <Text
        className="text-foreground text-3xl font-semibold leading-tight mb-3"
        testID="lock-schedule-title"
      >
        Lock this schedule?
      </Text>
      <Text
        className="text-foreground text-lg font-semibold leading-7 mb-2"
        testID="lock-schedule-preview"
      >
        {preview}
      </Text>
      <Text
        className="text-muted-foreground text-[15px] leading-6 mb-8"
        testID="lock-schedule-warning"
      >
        This cannot be changed later. Are you sure?
      </Text>

      {error ? (
        <Text className="text-red-400 text-[14px] mb-4" testID="lock-schedule-error">
          {error}
        </Text>
      ) : null}

      {busy ? (
        <View className="items-center py-6" testID="lock-schedule-busy">
          <ActivityIndicator color="#fafafa" />
          <Text className="text-muted-foreground mt-3 text-sm">
            Locking schedule…
          </Text>
        </View>
      ) : (
        <HoldToConfirm
          label="Hold to lock schedule"
          holdingLabel="Keep holding to confirm…"
          onConfirm={() => void onConfirm()}
          disabled={!valid}
          testID="lock-schedule-hold"
        />
      )}

      <Pressable
        className="py-4 items-center mt-4"
        onPress={() => router.back()}
        disabled={busy}
        testID="lock-schedule-cancel"
      >
        <Text className="text-muted-foreground text-[15px]">Go back</Text>
      </Pressable>
    </View>
  )
}
