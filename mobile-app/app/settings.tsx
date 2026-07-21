import { Link } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  formatClock12h,
  formatSuggestedSchedule,
} from '../services/baselineDetection'
import {
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  isPendingChangeActive,
} from '../services/scheduleChange'
import { syncScheduledLockTrigger } from '../services/syncScheduledLock'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Steps 150–151 — Settings: locked schedule read-only + rare delayed change path.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const bedtime = useScheduleStore((s) => s.bedtime)
  const waketime = useScheduleStore((s) => s.waketime)
  const lockedIn = useScheduleStore((s) => s.lockedIn)
  const lockedAt = useScheduleStore((s) => s.lockedAt)
  const pendingSleepTime = useScheduleStore((s) => s.pendingSleepTime)
  const pendingWakeTime = useScheduleStore((s) => s.pendingWakeTime)
  const pendingEffectiveAt = useScheduleStore((s) => s.pendingEffectiveAt)
  const promoteDuePending = useScheduleStore((s) => s.promoteDuePending)
  const getEnforcedTimes = useScheduleStore((s) => s.getEnforcedTimes)

  useEffect(() => {
    promoteDuePending()
    void syncScheduledLockTrigger().catch(() => {})
  }, [promoteDuePending])

  const hasSchedule = Boolean(bedtime && waketime)
  const pendingActive =
    hasSchedule &&
    isPendingChangeActive({
      sleepTime: bedtime!,
      wakeTime: waketime!,
      pendingSleepTime,
      pendingWakeTime,
      pendingEffectiveAt,
    })
  const enforced = getEnforcedTimes()
  const line =
    enforced != null
      ? formatSuggestedSchedule(enforced.bedtime, enforced.waketime)
      : hasSchedule && bedtime && waketime
        ? formatSuggestedSchedule(bedtime, waketime)
        : null

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
      testID="settings-screen"
    >
      <Text className="text-foreground text-2xl font-semibold mb-6">Settings</Text>

      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase mb-3">
        Sleep schedule
      </Text>

      {hasSchedule ? (
        <View
          className="bg-card border border-border rounded-lg px-4 py-4 mb-3"
          testID="settings-schedule-readonly"
        >
          <Text
            className="text-foreground text-lg font-semibold leading-7 mb-3"
            testID="settings-schedule-line"
          >
            {line}
          </Text>
          <Text className="text-muted-foreground text-sm mb-1">Sleep</Text>
          <Text
            className="text-foreground text-[16px] mb-3"
            testID="settings-sleep-time"
          >
            {formatClock12h(enforced?.bedtime ?? bedtime!)}
            <Text className="text-muted-foreground">
              {' '}
              ({enforced?.bedtime ?? bedtime})
            </Text>
          </Text>
          <Text className="text-muted-foreground text-sm mb-1">Wake</Text>
          <Text
            className="text-foreground text-[16px]"
            testID="settings-wake-time"
          >
            {formatClock12h(enforced?.waketime ?? waketime!)}
            <Text className="text-muted-foreground">
              {' '}
              ({enforced?.waketime ?? waketime})
            </Text>
          </Text>
          {lockedIn ? (
            <Text
              className="text-muted-foreground text-xs mt-4 leading-5"
              testID="settings-schedule-locked-note"
            >
              Locked
              {lockedAt
                ? ` ${new Date(lockedAt).toLocaleString()}`
                : ''}{' '}
              — cannot be edited instantly.
            </Text>
          ) : (
            <Text className="text-amber-400/90 text-xs mt-4">
              Draft — not locked yet.
            </Text>
          )}
        </View>
      ) : (
        <Text
          className="text-muted-foreground text-[15px] leading-6 mb-4"
          testID="settings-schedule-empty"
        >
          No schedule locked yet.
        </Text>
      )}

      {pendingActive ? (
        <View
          className="border border-border rounded-lg px-4 py-4 mb-4"
          testID="settings-pending-change"
        >
          <Text
            className="text-foreground text-[15px] leading-6 mb-2"
            testID="settings-change-effect-message"
          >
            {SCHEDULE_CHANGE_EFFECT_MESSAGE}
          </Text>
          <Text className="text-muted-foreground text-sm leading-5">
            Pending:{' '}
            {formatSuggestedSchedule(pendingSleepTime!, pendingWakeTime!)}
          </Text>
          <Text className="text-muted-foreground text-xs mt-2">
            Old schedule stays enforced until{' '}
            {pendingEffectiveAt
              ? new Date(pendingEffectiveAt).toLocaleString()
              : 'then'}
            .
          </Text>
        </View>
      ) : null}

      {lockedIn && !pendingActive ? (
        <Link href="/request-schedule-change" asChild>
          <Pressable className="py-3 mb-2" testID="settings-request-change">
            <Text className="text-sidebar-primary text-[15px] font-medium">
              Request schedule change (24h delay)
            </Text>
          </Pressable>
        </Link>
      ) : null}

      <Link href="/call-allowlist" asChild>
        <Pressable className="py-3" testID="settings-open-call-allowlist">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Call allow-list (lock)
          </Text>
        </Pressable>
      </Link>

      <Link href="/permissions-status" asChild>
        <Pressable className="py-3" testID="settings-open-permissions">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Permissions status
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}
