import { Redirect, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BreathingOrb } from '../components/locked/BreathingOrb'
import * as lockService from '../services/lockService'
import {
  formatLockedClock,
  formatUntilWake,
  LOCKED_SLEEP_MESSAGE,
} from '../services/lockedScreenClock'
import {
  LOW_BATTERY_LOCKED_HINT,
  LOW_BATTERY_THRESHOLD,
} from '../native/incomingCallPolicy'
import { useLockStateStore } from '../store/lockStateStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Step 160 — calm full-screen while the device is locked for the night.
 * Step 164 — low-battery hint; emergency dial remains an OS-level path.
 */
export default function LockedScreen() {
  const insets = useSafeAreaInsets()
  const isLocked = useLockStateStore((s) => s.isLocked)
  const ready = useLockStateStore((s) => s.ready)
  const isDeviceOwner = useLockStateStore((s) => s.isDeviceOwner)
  const setLocked = useLockStateStore((s) => s.setLocked)
  const waketime = useScheduleStore((s) => s.getEnforcedTimes()?.waketime ?? s.waketime)

  const [clock, setClock] = useState(() => formatLockedClock())
  const [softUnlocking, setSoftUnlocking] = useState(false)
  const [lowBattery, setLowBattery] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setClock(formatLockedClock())
    }, 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    const readBattery = () => {
      void lockService.getBatteryLevel().then((level) => {
        if (cancelled) return
        setLowBattery(level >= 0 && level <= LOW_BATTERY_THRESHOLD)
      })
    }
    readBattery()
    const id = setInterval(readBattery, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!ready || !isLocked) return
    const id = setInterval(() => {
      void lockService.isLocked().then((locked) => {
        setLocked(locked)
        if (!locked) router.replace('/')
      })
    }, 20_000)
    return () => clearInterval(id)
  }, [ready, isLocked, setLocked])

  if (ready && !isLocked) {
    return <Redirect href="/" />
  }

  const until = formatUntilWake(waketime)

  const softUnlock = () => {
    if (isDeviceOwner || softUnlocking) return
    setSoftUnlocking(true)
    void (async () => {
      try {
        await lockService.disableLock()
        setLocked(false)
        router.replace('/')
      } catch (err) {
        console.warn('[locked] soft unlock failed', err)
        setSoftUnlocking(false)
      }
    })()
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: '#07090e' }}
      testID="locked-screen"
    >
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: '#07090e',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute -top-32 left-[-30%] h-96 w-[160%] rounded-full opacity-40"
        style={{ backgroundColor: '#121820' }}
      />
      <View
        pointerEvents="none"
        className="absolute bottom-[-20%] right-[-20%] h-80 w-80 rounded-full opacity-25"
        style={{ backgroundColor: '#0f1822' }}
      />

      <View
        className="flex-1 items-center justify-center px-8"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text
          className="text-xs font-medium tracking-[0.28em] uppercase mb-14"
          style={{ color: 'rgba(180, 190, 205, 0.45)' }}
          testID="locked-brand"
        >
          Sleep Lock
        </Text>

        <Text
          className="font-light tabular-nums text-center mb-3"
          style={{
            fontSize: 64,
            lineHeight: 72,
            letterSpacing: 1,
            color: '#e8ecf2',
          }}
          testID="locked-clock"
        >
          {clock}
        </Text>

        <Text
          className="text-center text-lg font-normal mb-12"
          style={{ color: 'rgba(200, 210, 220, 0.72)' }}
          testID="locked-message"
        >
          {LOCKED_SLEEP_MESSAGE}
        </Text>

        <BreathingOrb />

        {until ? (
          <Text
            className="mt-12 text-sm"
            style={{ color: 'rgba(160, 175, 190, 0.4)' }}
            testID="locked-until"
          >
            {until}
          </Text>
        ) : null}

        {lowBattery ? (
          <Text
            className="mt-6 text-sm text-center px-4"
            style={{ color: 'rgba(210, 180, 140, 0.55)' }}
            testID="locked-low-battery"
          >
            {LOW_BATTERY_LOCKED_HINT}
          </Text>
        ) : null}

        {!isDeviceOwner ? (
          <Pressable
            className="absolute bottom-0 self-center py-4 px-6"
            style={{ bottom: insets.bottom + 8 }}
            onLongPress={softUnlock}
            delayLongPress={1800}
            disabled={softUnlocking}
            testID="locked-soft-unlock"
            accessibilityLabel="Hold to unlock"
          >
            <Text style={{ color: 'rgba(140, 155, 170, 0.28)', fontSize: 12 }}>
              {softUnlocking ? '…' : 'Hold to unlock'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
