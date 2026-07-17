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
import { useAppStore } from '../store/useAppStore'

/**
 * Step 136 — notification permission for the lock-in-30-minutes alert.
 */
export default function NotificationPermissionScreen() {
  const insets = useSafeAreaInsets()
  const setNotificationSetupDone = useAppStore((s) => s.setNotificationSetupDone)

  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<NotificationPermissionPhase | 'intro'>(
    'intro'
  )
  const [canAskAgain, setCanAskAgain] = useState(true)

  const finish = useCallback(() => {
    setNotificationSetupDone(true)
    router.replace('/set-home')
  }, [setNotificationSetupDone])

  const request = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestNotificationPermissions()
      setPhase(result.phase)
      setCanAskAgain(result.canAskAgain)
      if (result.phase === 'granted') {
        setNotificationSetupDone(true)
        router.replace('/set-home')
      }
    } catch (err: unknown) {
      console.error(err)
      setPhase('denied')
      setCanAskAgain(true)
    } finally {
      setBusy(false)
    }
  }, [setNotificationSetupDone])

  const showExplainer = phase === 'denied'

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
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
          onContinueWithout={finish}
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
            Example: “Phone will lock in {LOCK_WARNING_MINUTES} minutes.” You’ll
            get that heads-up before Sleep Lock engages.
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
