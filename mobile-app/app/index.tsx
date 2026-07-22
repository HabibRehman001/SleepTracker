import { Link, Redirect, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'

import {
  FULL_LOCK_ENABLED_LABEL,
  NOTIFICATION_ONLY_MODE_LABEL,
  SOFT_LOCK_ENABLED_LABEL,
  classifyLockCapability,
} from '../native'
import * as lockService from '../services/lockService'
import { registerMotionSampleTask } from '../services/backgroundTasks'
import { syncHomeGeofencing } from '../services/homeGeofence'
import { shouldShowLockCountdown } from '../services/lockCountdownMath'
import { isLockCountdownDismissedThisSession } from '../services/lockCountdownSession'
import { loadHomeArrivalTime } from '../services/homeArrival'
import { NEVER_ARRIVED_POLICY_SHORT } from '../services/neverArrivedPolicyMath'
import { syncScheduledLockTrigger } from '../services/syncScheduledLock'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/useAppStore'
import { useBaselineStore } from '../store/baselineStore'
import { useHomeLocationStore } from '../store/homeLocationStore'
import { useLockStateStore } from '../store/lockStateStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Home — stats-driven soft lock. First-run: onboarding → account → permissions → set-home → home.
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
  const [appFlagsHydrated, setAppFlagsHydrated] = useState(() =>
    useAppStore.persist.hasHydrated()
  )

  useEffect(() => {
    if (appFlagsHydrated) return
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setAppFlagsHydrated(true)
    })
    if (useAppStore.persist.hasHydrated()) setAppFlagsHydrated(true)
    return unsub
  }, [appFlagsHydrated])

  useEffect(() => {
    void hydrateAuth()
  }, [hydrateAuth])

  useEffect(() => {
    if (!motionSetupDone) return
    void registerMotionSampleTask().catch((err: unknown) => {
      console.warn('[MOTION_SAMPLE] register failed', err)
    })
    // Step 181 — prefer hardware pedometer while the app is open.
    void import('../store/pedometerStore').then(({ usePedometerStore }) => {
      const s = usePedometerStore.getState()
      void s.hydrateAvailability().then((ok) => {
        if (ok) void s.startWatch()
      })
    })
  }, [motionSetupDone])

  useEffect(() => {
    if (!homeSetupDone || homeLat == null || homeLng == null) return
    void syncHomeGeofencing({ latitude: homeLat, longitude: homeLng }).catch(
      (err: unknown) => {
        console.warn('[HOME_GEOFENCE] sync failed', err)
      }
    )
  }, [homeSetupDone, homeLat, homeLng])

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
      const enforced = useScheduleStore.getState().getEnforcedTimes()
      if (!enforced) {
        if (!cancelled) setCountdownRedirect(false)
        return
      }
      const arrival = await loadHomeArrivalTime()
      const gate = shouldShowLockCountdown({
        now: new Date(),
        scheduledSleepHHMM: enforced.bedtime,
        wakeTimeHHMM: enforced.waketime,
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
    if (!authToken || !authUser) return
    lockService.configureLockService()
    void (async () => {
      try {
        const accountLocked = await lockService.syncAccountLockFromServer()
        const [locked, owner, family] = await Promise.all([
          lockService.isLocked(),
          lockService.isDeviceOwner(),
          lockService.hasFamilyControlsEntitlement(),
        ])
        setLocked(accountLocked || locked)
        setDeviceOwner(owner)
        setFamilyControls(family)
        setLockCapability(classifyLockCapability(owner, family))
      } catch (err: unknown) {
        setLastError(err instanceof Error ? err.message : 'Failed to read lock')
      } finally {
        setReady(true)
      }
    })()
  }, [
    authToken,
    authUser,
    setLocked,
    setDeviceOwner,
    setFamilyControls,
    setLockCapability,
    setReady,
    setLastError,
  ])

  useEffect(() => {
    if (!notificationSetupDone) return
    void import('../services/monthEndSummary')
      .then((m) => m.syncMonthEndSummaryNotification())
      .catch((err: unknown) => {
        console.warn('[MONTH_END_SUMMARY] sync failed', err)
      })
  }, [notificationSetupDone])

  useEffect(() => {
    if (!notificationSetupDone) return
    if (homeSetupDone) {
      void hydrateFromBackend()
      return
    }
    void hydrateFromBackend().then((home) => {
      if (home) setHomeSetupDone(true)
    })
  }, [
    notificationSetupDone,
    homeSetupDone,
    hydrateFromBackend,
    setHomeSetupDone,
  ])

  if (!authHydrated || !appFlagsHydrated) {
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

  if (ready && isLocked) {
    return <Redirect href="/locked" />
  }

  const toggle = async () => {
    setBusy(true)
    setLastError(null)
    try {
      if (await lockService.isLocked()) {
        await lockService.disableLock()
      } else {
        const wake =
          useScheduleStore.getState().getEnforcedTimes()?.waketime ??
          useScheduleStore.getState().waketime
        await lockService.enableLock({ wakeHHMM: wake })
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
          Driven by your sleep stats and schedule.
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
          Soft lock from your sleep stats: schedules, countdown, and the sleep
          lock screen on any device where you sign in.
        </Text>
      </View>
    )

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 24,
      }}
      testID="home-screen"
    >
      <Text className="text-foreground text-3xl font-semibold mb-3">
        Sleep Lock
      </Text>
      <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-2">
        Stats-driven soft lock — schedules, reminders, and a calm lock screen
        while you sleep.
      </Text>
      <Text
        className="text-muted-foreground text-center text-xs leading-5 mb-4"
        testID="home-never-arrived-hint"
      >
        {NEVER_ARRIVED_POLICY_SHORT} See Settings for details.
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
      <Link href={'/current-location' as Href} asChild>
        <Pressable className="px-4 py-2.5" testID="open-current-location">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Current location
          </Text>
        </Pressable>
      </Link>
      <Link href={'/live-steps' as Href} asChild>
        <Pressable className="px-4 py-2.5" testID="open-live-steps">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Live steps (pedometer)
          </Text>
        </Pressable>
      </Link>
      <Link href={'/activity' as Href} asChild>
        <Pressable className="px-4 py-2.5" testID="open-activity">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Activity
          </Text>
        </Pressable>
      </Link>
      <Link href={'/monthly-report' as Href} asChild>
        <Pressable className="px-4 py-2.5" testID="open-monthly-report">
          <Text className="text-sidebar-primary text-[15px] font-medium">
            Monthly report
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
    </ScrollView>
  )
}
