import { Link, Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import {
  FULL_LOCK_ENABLED_LABEL,
  NOTIFICATION_ONLY_MODE_LABEL,
  SOFT_LOCK_ENABLED_LABEL,
  classifyLockCapability,
} from '../native'
import * as lockService from '../services/lockService'
import { registerMotionSampleTask } from '../services/backgroundTasks'
import { loadHomeArrivalTime } from '../services/homeArrival'
import { shouldShowLockCountdown } from '../services/lockCountdownMath'
import { isLockCountdownDismissedThisSession } from '../services/lockCountdownSession'
import { syncScheduledLockTrigger } from '../services/syncScheduledLock'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/useAppStore'
import { useBaselineStore } from '../store/baselineStore'
import { useHomeLocationStore } from '../store/homeLocationStore'
import { useLockStateStore } from '../store/lockStateStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Home — soft lock from stats by default; Device Owner / Family Controls optional.
 * First-run: onboarding → account → permissions → set-home → home.
 */
export default function HomeScreen() {
  const onboardingDone = useAppStore((s) => s.onboardingDone)
  const locationSetupDone = useAppStore((s) => s.locationSetupDone)
  const motionSetupDone = useAppStore((s) => s.motionSetupDone)
  const notificationSetupDone = useAppStore((s) => s.notificationSetupDone)
  const homeSetupDone = useAppStore((s) => s.homeSetupDone)
  const setHomeSetupDone = useAppStore((s) => s.setHomeSetupDone)

  const authHydrated = useAuthStore((s) => s.hydrated)
  const authUser = useAuthStore((s) => s.user)
  const authToken = useAuthStore((s) => s.token)
  const hydrateAuth = useAuthStore((s) => s.hydrate)
  const logout = useAuthStore((s) => s.logout)

  const pendingManualEntry = useBaselineStore((s) => s.pendingManualEntry)
  const detectionPrompt = useBaselineStore((s) => s.lastDetectionPrompt)
  const baselineReady = useBaselineStore((s) => s.baselineReady)
  const baselineResultsSeen = useBaselineStore((s) => s.baselineResultsSeen)
  const scheduleLockedIn = useScheduleStore((s) => s.lockedIn)

  const homeHydrated = useHomeLocationStore((s) => s.hydrated)
  const homeLat = useHomeLocationStore((s) => s.latitude)
  const homeLng = useHomeLocationStore((s) => s.longitude)
  const hydrateFromBackend = useHomeLocationStore((s) => s.hydrateFromBackend)

  const isLocked = useLockStateStore((s) => s.isLocked)
  const lockCapability = useLockStateStore((s) => s.lockCapability)
  const busy = useLockStateStore((s) => s.busy)
  const ready = useLockStateStore((s) => s.ready)
  const setLocked = useLockStateStore((s) => s.setLocked)
  const setDeviceOwner = useLockStateStore((s) => s.setDeviceOwner)
  const setFamilyControls = useLockStateStore((s) => s.setFamilyControls)
  const setLockCapability = useLockStateStore((s) => s.setLockCapability)
  const setBusy = useLockStateStore((s) => s.setBusy)
  const setReady = useLockStateStore((s) => s.setReady)
  const setLastError = useLockStateStore((s) => s.setLastError)

  /** null = still resolving pre-lock countdown gate (Step 156). */
  const [countdownRedirect, setCountdownRedirect] = useState<boolean | null>(
    null
  )

  useEffect(() => {
    void hydrateAuth()
  }, [hydrateAuth])

  useEffect(() => {
    if (!motionSetupDone) return
    void registerMotionSampleTask().catch((err: unknown) => {
      console.warn('[MOTION_SAMPLE] register failed', err)
    })
  }, [motionSetupDone])

  useEffect(() => {
    if (!scheduleLockedIn) return
    void syncScheduledLockTrigger().catch((err: unknown) => {
      console.warn('[SCHEDULED_LOCK] sync failed', err)
    })
  }, [scheduleLockedIn])

  useEffect(() => {
    if (!scheduleLockedIn || !ready) {
      setCountdownRedirect(false)
      return
    }
    if (isLocked) {
      setCountdownRedirect(false)
      return
    }
    let cancelled = false
    void (async () => {
      const arrival = await loadHomeArrivalTime()
      const enforced = useScheduleStore.getState().getEnforcedTimes()
      if (!enforced) {
        if (!cancelled) setCountdownRedirect(false)
        return
      }
      const gate = shouldShowLockCountdown({
        now: new Date(),
        scheduledSleepHHMM: enforced.bedtime,
        homeArrivalTime: arrival,
        scheduleLockedIn: true,
        currentlyLocked: isLocked,
        dismissedThisSession: isLockCountdownDismissedThisSession(),
      })
      if (!cancelled) setCountdownRedirect(gate.show)
    })()
    return () => {
      cancelled = true
    }
  }, [scheduleLockedIn, isLocked, ready])

  useEffect(() => {
    lockService.configureLockService()
    void Promise.all([
      lockService.isLocked(),
      lockService.isDeviceOwner(),
      lockService.hasFamilyControlsEntitlement(),
    ])
      .then(([locked, owner, family]) => {
        setLocked(locked)
        setDeviceOwner(owner)
        setFamilyControls(family)
        setLockCapability(classifyLockCapability(owner, family))
        setReady(true)
      })
      .catch((err: unknown) => {
        setLastError(err instanceof Error ? err.message : 'Failed to read lock')
        setReady(true)
      })
  }, [
    setLocked,
    setDeviceOwner,
    setFamilyControls,
    setLockCapability,
    setReady,
    setLastError,
  ])

  useEffect(() => {
    if (!notificationSetupDone || homeSetupDone) return
    void hydrateFromBackend().then((home) => {
      if (home) setHomeSetupDone(true)
    })
  }, [
    notificationSetupDone,
    homeSetupDone,
    hydrateFromBackend,
    setHomeSetupDone,
  ])

  if (!authHydrated) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator color="#fafafa" />
      </View>
    )
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />
  }

  if (!authToken || !authUser) {
    return <Redirect href="/auth" />
  }

  if (!locationSetupDone) {
    return <Redirect href="/location-permission" />
  }

  if (!motionSetupDone) {
    return <Redirect href="/motion-permission" />
  }

  if (!notificationSetupDone) {
    return <Redirect href="/notification-permission" />
  }

  if (!homeSetupDone) {
    if (!homeHydrated) {
      return (
        <View className="bg-background flex-1 items-center justify-center">
          <ActivityIndicator color="#fafafa" />
        </View>
      )
    }
    return <Redirect href="/set-home" />
  }

  if (
    baselineReady &&
    !baselineResultsSeen &&
    !scheduleLockedIn &&
    !pendingManualEntry
  ) {
    return <Redirect href="/baseline-results" />
  }

  if (scheduleLockedIn && countdownRedirect === null) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator color="#fafafa" />
      </View>
    )
  }

  if (countdownRedirect) {
    return <Redirect href="/lock-countdown" />
  }

  const toggle = async () => {
    setBusy(true)
    setLastError(null)
    try {
      if (await lockService.isLocked()) {
        await lockService.disableLock()
      } else {
        await lockService.enableLock()
      }
      setLocked(await lockService.isLocked())
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Lock toggle failed')
    } finally {
      setBusy(false)
    }
  }

  const capabilityBadge =
    lockCapability === 'full' ? (
      <View
        className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm items-center"
        testID="full-lock-enabled-badge"
      >
        <Text className="text-foreground text-base font-semibold">
          {FULL_LOCK_ENABLED_LABEL}
        </Text>
      </View>
    ) : lockCapability === 'soft' ? (
      <View
        className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm items-center"
        testID="soft-lock-enabled-badge"
      >
        <Text className="text-foreground text-base font-semibold">
          {SOFT_LOCK_ENABLED_LABEL}
        </Text>
        <Text className="text-muted-foreground text-center text-xs leading-5 mt-1">
          Driven by your sleep stats. Full device lock needs Device Owner
          (optional).
        </Text>
      </View>
    ) : (
      <View
        className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm"
        testID="notification-only-mode-badge"
      >
        <Text className="text-foreground text-base font-semibold text-center mb-1">
          {NOTIFICATION_ONLY_MODE_LABEL}
        </Text>
        <Text className="text-muted-foreground text-center text-xs leading-5">
          Soft lock from your stats: schedules and countdown alerts. Full phone
          lockdown needs Device Owner (Android) or Family Controls (iOS) — optional
          later.
        </Text>
      </View>
    )

  return (
    <View
      className="bg-background flex-1 items-center justify-center px-6"
      testID="home-screen"
    >
      <Text className="text-foreground text-3xl font-semibold mb-3">
        Sleep Lock
      </Text>
      <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-2">
        Stats-driven soft lock — reminders and schedule help, not a full system
        lockdown unless Device Owner is enabled.
      </Text>
      {authUser ? (
        <Text
          className="text-muted-foreground text-xs mb-4"
          testID="auth-user-email"
        >
          {authUser.email}
        </Text>
      ) : null}

      {capabilityBadge}

      {pendingManualEntry ? (
        <View
          className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm"
          testID="failed-detection-banner"
        >
          <Text className="text-foreground text-[15px] leading-6 mb-3 text-center">
            {detectionPrompt ??
              "We couldn't detect last night's sleep — want to enter it manually?"}
          </Text>
          <Link href="/manual-sleep-entry" asChild>
            <Pressable
              className="bg-primary py-3 rounded-lg items-center"
              testID="open-manual-sleep-entry"
            >
              <Text className="text-primary-foreground text-base font-semibold">
                Enter sleep manually
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {homeLat != null && homeLng != null ? (
        <Text
          className="text-muted-foreground font-mono text-xs mb-4"
          testID="home-coords-badge"
        >
          Home {homeLat.toFixed(4)}, {homeLng.toFixed(4)}
        </Text>
      ) : null}
      <View className="bg-card border border-border rounded-lg px-4 py-3 mb-4 w-full max-w-sm">
        <Text
          className="text-card-foreground text-lg font-semibold tracking-wide text-center"
          testID="lock-status"
        >
          {!ready ? '…' : isLocked ? 'LOCKED' : 'unlocked'}
        </Text>
      </View>
      <Pressable
        className={`bg-primary px-5 py-3 rounded-lg mb-3 ${busy ? 'opacity-50' : ''}`}
        onPress={() => void toggle()}
        disabled={busy || !ready}
        testID="lock-toggle"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          {isLocked ? 'Disable lock' : 'Enable lock'}
        </Text>
      </Pressable>
      <Link href="/permissions-status" asChild>
        <Pressable className="px-4 py-2.5" testID="open-permissions-status">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Permissions status
          </Text>
        </Pressable>
      </Link>
      <Link href="/settings" asChild>
        <Pressable className="px-4 py-2.5" testID="open-settings">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Settings
          </Text>
        </Pressable>
      </Link>
      {baselineReady ? (
        <Link href="/baseline-results" asChild>
          <Pressable className="px-4 py-2.5" testID="open-baseline-results">
            <Text className="text-sidebar-primary text-[15px] font-medium">
              Baseline results
            </Text>
          </Pressable>
        </Link>
      ) : null}
      <Link href="/device-owner-setup" asChild>
        <Pressable className="px-4 py-2.5" testID="open-device-owner-setup">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Optional: full lock (Device Owner)
          </Text>
        </Pressable>
      </Link>
      <Link href="/family-controls-setup" asChild>
        <Pressable className="px-4 py-2.5" testID="open-family-controls-setup">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Optional: Family Controls (iOS)
          </Text>
        </Pressable>
      </Link>
      <Link href="/onboarding" asChild>
        <Pressable className="px-4 py-2.5" testID="open-onboarding">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Replay onboarding
          </Text>
        </Pressable>
      </Link>
      <Link href="/set-home" asChild>
        <Pressable className="px-4 py-2" testID="open-set-home">
          <Text className="text-muted-foreground text-[14px]">
            Change home location
          </Text>
        </Pressable>
      </Link>
      <Pressable
        className="px-4 py-2 mt-2"
        onPress={() => void logout()}
        testID="auth-logout"
      >
        <Text className="text-muted-foreground text-[14px]">Log out</Text>
      </Pressable>
    </View>
  )
}
