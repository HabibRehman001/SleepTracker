import { Redirect, router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
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
 * Layout is viewport-locked (no page scroll); decorative blobs are clipped.
 */
export default function LockedScreen() {
  const insets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()
  const isLocked = useLockStateStore((s) => s.isLocked)
  const ready = useLockStateStore((s) => s.ready)
  const isDeviceOwner = useLockStateStore((s) => s.isDeviceOwner)
  const setLocked = useLockStateStore((s) => s.setLocked)
  const waketime = useScheduleStore(
    (s) => s.getEnforcedTimes()?.waketime ?? s.waketime
  )

  const [clock, setClock] = useState(() => formatLockedClock())
  const [softUnlocking, setSoftUnlocking] = useState(false)
  const [lowBattery, setLowBattery] = useState(false)

  const compact = height < 700
  const clockSize = Math.min(compact ? 44 : 56, Math.round(width * 0.14))
  const orbSize = compact ? 120 : 160

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
      void (async () => {
        const accountLocked = await lockService.syncAccountLockFromServer()
        const locked = accountLocked || (await lockService.isLocked())
        setLocked(locked)
        if (!locked) router.replace('/')
      })()
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
      style={{
        flex: 1,
        width: '100%',
        height: Platform.OS === 'web' ? ('100vh' as unknown as number) : '100%',
        maxHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : undefined,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        position: 'relative',
      }}
      testID="locked-screen"
    >
      {/* Clipped decorative layer — never expands document scroll */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: -80,
            left: '-20%',
            height: 280,
            width: '140%',
            borderRadius: 999,
            opacity: 0.4,
            backgroundColor: '#121820',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -60,
            right: -40,
            height: 220,
            width: 220,
            borderRadius: 110,
            opacity: 0.25,
            backgroundColor: '#0f1822',
          }}
        />
      </View>

      <View
        style={{
          flex: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 28,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 16,
          overflow: 'hidden',
        }}
      >
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text
            style={{
              color: 'rgba(180, 190, 205, 0.45)',
              fontSize: 12,
              fontWeight: '500',
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: compact ? 16 : 24,
            }}
            testID="locked-brand"
          >
            Sleep Lock
          </Text>

          <Text
            style={{
              fontWeight: '300',
              fontVariant: ['tabular-nums'],
              textAlign: 'center',
              marginBottom: 8,
              fontSize: clockSize,
              lineHeight: clockSize + 6,
              letterSpacing: 1,
              color: '#e8ecf2',
            }}
            testID="locked-clock"
          >
            {clock}
          </Text>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 17,
              color: 'rgba(200, 210, 220, 0.72)',
              marginBottom: compact ? 16 : 24,
            }}
            testID="locked-message"
          >
            {LOCKED_SLEEP_MESSAGE}
          </Text>
        </View>

        <BreathingOrb size={orbSize} />

        <View style={{ alignItems: 'center', width: '100%', minHeight: 72 }}>
          {until ? (
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(160, 175, 190, 0.4)',
                marginBottom: 8,
              }}
              testID="locked-until"
            >
              {until}
            </Text>
          ) : null}

          {lowBattery ? (
            <Text
              style={{
                fontSize: 13,
                textAlign: 'center',
                color: 'rgba(210, 180, 140, 0.55)',
                paddingHorizontal: 12,
                marginBottom: 8,
              }}
              testID="locked-low-battery"
            >
              {LOW_BATTERY_LOCKED_HINT}
            </Text>
          ) : null}

          {!isDeviceOwner ? (
            <Pressable
              style={{ paddingVertical: 12, paddingHorizontal: 20 }}
              onLongPress={softUnlock}
              delayLongPress={1800}
              disabled={softUnlocking}
              testID="locked-soft-unlock"
              accessibilityLabel="Hold to unlock"
            >
              <Text style={{ color: 'rgba(140, 155, 170, 0.35)', fontSize: 12 }}>
                {softUnlocking ? '…' : 'Hold to unlock'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}
