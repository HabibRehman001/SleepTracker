import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { NotificationPermissionExplainer } from '../components/notifications/NotificationPermissionExplainer'
import {
  LOCK_WARNING_MINUTES,
  NOTIFICATION_PURPOSE,
  requestNotificationPermissions,
  type NotificationPermissionPhase,
} from '../services/notifications'
import { showPermissionRequiredAlert } from '../services/permissionGate'
import { useAppStore } from '../store/useAppStore'

/**
 * Hard-gated notification permission — cannot continue without Allow.
 */
export default function NotificationPermissionScreen() {
  const insets = useSafeAreaInsets()
  const setNotificationSetupDone = useAppStore((s) => s.setNotificationSetupDone)

  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<NotificationPermissionPhase | 'intro'>(
    'intro'
  )
  const [canAskAgain, setCanAskAgain] = useState(true)

  const request = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestNotificationPermissions()
      setCanAskAgain(result.canAskAgain)

      if (result.phase === 'granted') {
        setNotificationSetupDone(true)
        void import('../services/monthEndSummary')
          .then((m) => m.syncMonthEndSummaryNotification())
          .catch((err: unknown) => {
            console.warn('[MONTH_END_SUMMARY] sync after grant failed', err)
          })
        router.replace('/set-home')
        return
      }

      if (result.canAskAgain) {
        setPhase('intro')
        showPermissionRequiredAlert({
          canAskAgain: true,
          onRetry: () => void request(),
          detail:
            'Notifications are required for lock countdown alerts. Tap OK to allow access.',
        })
      } else {
        setPhase('denied')
      }
    } catch (err: unknown) {
      console.error(err)
      setPhase('intro')
      showPermissionRequiredAlert({
        canAskAgain: true,
        onRetry: () => void request(),
      })
    } finally {
      setBusy(false)
    }
  }, [setNotificationSetupDone])

  const showExplainer = phase === 'denied' && !canAskAgain

  return (
    <View
      className="bg-background flex-1"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        overflow: 'hidden',
      }}
      testID="notification-permission-screen"
    >
      <View
        pointerEvents="none"
        className="absolute -top-16 right-[-20%] h-64 w-[110%] rounded-full opacity-25"
        style={{ backgroundColor: '#1a1a22' }}
      />

      {showExplainer ? (
        <NotificationPermissionExplainer
          canAskAgain={canAskAgain}
          onTryAgain={() => void request()}
        />
      ) : (
        <View className="flex-1 justify-center px-8">
          <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4">
            Permissions
          </Text>
          <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
            Lock countdown alerts
          </Text>
          <Text className="text-muted-foreground text-[16px] leading-7 mb-3">
            {NOTIFICATION_PURPOSE}
          </Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            Example: “Phone locks in {LOCK_WARNING_MINUTES} minutes.” You’ll get
            that heads-up before Sleep Lock engages. You must allow to continue.
          </Text>

          <Pressable
            className={`bg-primary py-4 rounded-lg items-center ${busy ? 'opacity-50' : ''}`}
            onPress={() => void request()}
            disabled={busy}
            testID="notification-request-permissions"
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {busy ? 'Requesting…' : 'Allow notifications'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
