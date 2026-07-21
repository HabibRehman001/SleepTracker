import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HoldToConfirm } from '../components/HoldToConfirm'
import {
  formatSuggestedSchedule,
} from '../services/baselineDetection'
import { isValidHHMM } from '../services/nightDetection'
import {
  requestScheduleChange,
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
} from '../services/scheduleApi'
import {
  resolveEnforcedSchedule,
} from '../services/scheduleChange'
import { syncScheduledLockTrigger } from '../services/syncScheduledLock'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Step 151 — rare override: request a schedule change with a 24h delay.
 */
export default function RequestScheduleChangeScreen() {
  const insets = useSafeAreaInsets()
  const bedtime = useScheduleStore((s) => s.bedtime)
  const waketime = useScheduleStore((s) => s.waketime)
  const lockedIn = useScheduleStore((s) => s.lockedIn)
  const pendingSleepTime = useScheduleStore((s) => s.pendingSleepTime)
  const pendingWakeTime = useScheduleStore((s) => s.pendingWakeTime)
  const pendingEffectiveAt = useScheduleStore((s) => s.pendingEffectiveAt)
  const applyPendingChange = useScheduleStore((s) => s.applyPendingChange)

  const [sleepTime, setSleepTime] = useState(bedtime ?? '04:00')
  const [wakeTime, setWakeTime] = useState(waketime ?? '12:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)

  const pendingActive =
    Boolean(pendingSleepTime && pendingWakeTime && pendingEffectiveAt) &&
    new Date(pendingEffectiveAt!).getTime() > Date.now()

  const enforced =
    bedtime && waketime
      ? resolveEnforcedSchedule({
          sleepTime: bedtime,
          wakeTime: waketime,
          pendingSleepTime,
          pendingWakeTime,
          pendingEffectiveAt,
        })
      : null

  const onConfirm = async () => {
    const bed = sleepTime.trim()
    const wake = wakeTime.trim()
    if (!isValidHHMM(bed) || !isValidHHMM(wake)) {
      setError('Use 24h times like 04:00 and 12:00')
      return
    }
    if (!lockedIn) {
      setError('Lock a schedule before requesting a change')
      return
    }
    if (bed === bedtime && wake === waketime) {
      setError('Choose times that differ from your current schedule')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await requestScheduleChange(bed, wake)
      const effectiveAt =
        result.pendingEffectiveAt ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      applyPendingChange(
        result.pendingSleepTime ?? bed,
        result.pendingWakeTime ?? wake,
        effectiveAt,
        result.pendingRequestedAt ?? new Date().toISOString()
      )
      await syncScheduledLockTrigger()
      setSubmittedMessage(
        result.message ??
          result.changeEffectMessage ??
          SCHEDULE_CHANGE_EFFECT_MESSAGE
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!lockedIn) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        testID="request-change-unlocked"
      >
        <Text className="text-muted-foreground text-center mb-4">
          You need a locked schedule before requesting a change.
        </Text>
        <Pressable
          className="bg-primary px-5 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-primary-foreground font-semibold">Back</Text>
        </Pressable>
      </View>
    )
  }

  if (submittedMessage || pendingActive) {
    const msg = submittedMessage ?? SCHEDULE_CHANGE_EFFECT_MESSAGE
    const pendingLine =
      pendingSleepTime && pendingWakeTime
        ? formatSuggestedSchedule(pendingSleepTime, pendingWakeTime)
        : null
    return (
      <View
        className="bg-background flex-1 px-6"
        style={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }}
        testID="request-change-pending"
      >
        <Text
          className="text-foreground text-2xl font-semibold leading-tight mb-3"
          testID="request-change-effect-message"
        >
          {msg}
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
          Your current schedule stays enforced until then — this is not an
          instant edit.
        </Text>
        {enforced ? (
          <View
            className="bg-card border border-border rounded-lg px-4 py-4 mb-4"
            testID="request-change-enforced"
          >
            <Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
              Still enforced
            </Text>
            <Text className="text-foreground text-lg font-semibold">
              {formatSuggestedSchedule(enforced.sleepTime, enforced.wakeTime)}
            </Text>
          </View>
        ) : null}
        {pendingLine ? (
          <View className="bg-card border border-border rounded-lg px-4 py-4 mb-6">
            <Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
              Pending
            </Text>
            <Text className="text-foreground text-lg font-semibold">
              {pendingLine}
            </Text>
          </View>
        ) : null}
        <Pressable
          className="bg-primary py-4 rounded-lg items-center"
          onPress={() => router.replace('/settings')}
          testID="request-change-done"
        >
          <Text className="text-primary-foreground font-semibold">
            Back to Settings
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
      testID="request-schedule-change-screen"
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-3">
        Rare override
      </Text>
      <Text className="text-foreground text-3xl font-semibold leading-tight mb-2">
        Request a schedule change
      </Text>
      <Text className="text-muted-foreground text-[15px] leading-6 mb-6">
        For emergencies or travel only. Changes take 24 hours — you cannot dodge
        tonight&apos;s lock at 3 AM.
      </Text>

      {enforced ? (
        <Text
          className="text-foreground text-[15px] mb-4"
          testID="request-change-current"
        >
          Current (enforced):{' '}
          {formatSuggestedSchedule(enforced.sleepTime, enforced.wakeTime)}
        </Text>
      ) : null}

      <Text className="text-muted-foreground text-sm mb-1">New sleep</Text>
      <TextInput
        className="bg-card border border-border text-foreground rounded-lg px-3 py-3 mb-3 text-[16px]"
        value={sleepTime}
        onChangeText={setSleepTime}
        placeholder="04:00"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        autoCorrect={false}
        testID="request-change-sleep"
      />
      <Text className="text-muted-foreground text-sm mb-1">New wake</Text>
      <TextInput
        className="bg-card border border-border text-foreground rounded-lg px-3 py-3 mb-6 text-[16px]"
        value={wakeTime}
        onChangeText={setWakeTime}
        placeholder="12:00"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        autoCorrect={false}
        testID="request-change-wake"
      />

      {error ? (
        <Text className="text-red-400 text-[14px] mb-3" testID="request-change-error">
          {error}
        </Text>
      ) : null}

      {busy ? (
        <ActivityIndicator color="#fafafa" />
      ) : (
        <HoldToConfirm
          label="Hold to request change"
          holdingLabel="Keep holding…"
          onConfirm={() => void onConfirm()}
          testID="request-change-hold"
        />
      )}

      <Pressable
        className="py-4 items-center mt-3"
        onPress={() => router.back()}
        testID="request-change-cancel"
      >
        <Text className="text-muted-foreground text-[15px]">Cancel</Text>
      </Pressable>
    </View>
  )
}
