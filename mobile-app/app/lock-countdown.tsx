import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import * as lockService from '../services/lockService'
import { loadHomeArrivalTime } from '../services/homeArrival'
import {
  formatCountdown,
  shouldShowLockCountdown,
} from '../services/lockCountdownMath'
import {
  dismissLockCountdownThisSession,
} from '../services/lockCountdownSession'
import { useLockStateStore } from '../store/lockStateStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Step 156 — full-screen countdown after the 30-min warning, before lock engages.
 */
export default function LockCountdownScreen() {
  const insets = useSafeAreaInsets()
  const bedtime = useScheduleStore((s) => s.bedtime)
  const waketime = useScheduleStore((s) => s.waketime)
  const lockedIn = useScheduleStore((s) => s.lockedIn)
  const setLocked = useLockStateStore((s) => s.setLocked)

  const [lockAt, setLockAt] = useState<Date | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const [ready, setReady] = useState(false)
  const [engaging, setEngaging] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const now = new Date()
      const arrival = await loadHomeArrivalTime()
      const gate = shouldShowLockCountdown({
        now,
        scheduledSleepHHMM: bedtime ?? '04:00',
        wakeTimeHHMM: waketime ?? undefined,
        homeArrivalTime: arrival,
        scheduleLockedIn: lockedIn,
        currentlyLocked: false,
      })
      if (cancelled) return
      if (!gate.show || !gate.lockAt) {
        router.replace('/')
        return
      }
      setLockAt(gate.lockAt)
      setRemainingMs(gate.remainingMs)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [bedtime, waketime, lockedIn])

  useEffect(() => {
    if (!lockAt || !ready) return
    const tick = () => {
      const ms = lockAt.getTime() - Date.now()
      setRemainingMs(ms)
      if (ms <= 0 && !engaging) {
        setEngaging(true)
        void (async () => {
          try {
            await lockService.enableLock()
            setLocked(true)
          } catch (err) {
            console.warn('[lock-countdown] enableLock failed', err)
          } finally {
            router.replace('/locked')
          }
        })()
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [lockAt, ready, engaging, setLocked])

  const onWindDown = () => {
    dismissLockCountdownThisSession()
    router.replace('/')
  }

  if (!ready) {
    return (
      <View
        className="bg-background flex-1"
        testID="lock-countdown-loading"
      />
    )
  }

  const display = formatCountdown(remainingMs)
  const lockLabel = lockAt
    ? lockAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 20,
        overflow: 'hidden',
      }}
      testID="lock-countdown-screen"
    >
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: '#0c0c10',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute -top-24 left-[-20%] h-72 w-[140%] rounded-full opacity-30"
        style={{ backgroundColor: '#1a1520' }}
      />

      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase mb-4">
        Sleep Lock
      </Text>
      <Text
        className="text-foreground text-2xl font-semibold leading-tight mb-2"
        testID="lock-countdown-title"
      >
        Phone locks soon
      </Text>
      <Text className="text-muted-foreground text-[16px] leading-6 mb-10">
        Wind down now — Soft Lock engages at {lockLabel}. This heads-up is so
        the lock isn&apos;t a surprise.
      </Text>

      <View className="flex-1 items-center justify-center -mt-8">
        <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.16em] mb-4">
          Time remaining
        </Text>
        <Text
          className="text-foreground font-semibold tabular-nums"
          style={{ fontSize: 72, lineHeight: 80, letterSpacing: 2 }}
          testID="lock-countdown-timer"
        >
          {display}
        </Text>
      </View>

      <Pressable
        className="py-4 items-center"
        onPress={onWindDown}
        testID="lock-countdown-dismiss"
      >
        <Text className="text-muted-foreground text-[15px]">
          I&apos;ll wind down
        </Text>
      </Pressable>
    </View>
  )
}
